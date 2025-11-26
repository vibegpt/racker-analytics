/**
 * INTEGRATION EXAMPLE: Adaptive Correlation Engine
 * 
 * This shows how to integrate the adaptive engine into your existing
 * track API and attribution workflow.
 */

import { AdaptiveCorrelationEngine } from './adaptive-engine';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// INITIALIZE ENGINE (Singleton)
// ============================================================================

let engineInstance: AdaptiveCorrelationEngine | null = null;

export function getAdaptiveEngine(): AdaptiveCorrelationEngine {
  if (!engineInstance) {
    engineInstance = new AdaptiveCorrelationEngine(24 * 60); // 24 hour window
    
    // Load pre-trained weights from database if available
    loadProductionWeights().then(weights => {
      if (weights) {
        engineInstance?.loadWeights(weights);
        console.log('[Engine] Loaded production weights');
      }
    });
  }
  
  return engineInstance;
}

async function loadProductionWeights() {
  // In production, load from database or cache
  // For now, return null to use defaults
  return null;
}

// ============================================================================
// INTEGRATION 1: Smart Link Click → Sale (Ground Truth)
// ============================================================================

/**
 * Called when Stripe webhook fires after a smart link click
 * This is 100% certain attribution - use it to train the model
 */
export async function recordSmartLinkConversion(
  clickId: string,
  saleId: string
) {
  const engine = getAdaptiveEngine();
  
  // Fetch the click and sale data
  const click = await prisma.click.findUnique({
    where: { id: clickId },
    include: { link: true }
  });
  
  const sale = await prisma.sale.findUnique({
    where: { id: saleId }
  });
  
  if (!click || !sale) return;
  
  // Calculate features
  const timeDeltaMinutes = Math.floor(
    (sale.createdAt.getTime() - click.clickedAt.getTime()) / 60000
  );
  
  // Geo match score (Jaccard similarity)
  const geoMatchScore = calculateGeoMatch(click, sale);
  
  // Sentiment score (from recent posts)
  const sentimentScore = await getRecentSentiment(click.link.platform);
  
  // Record this as ground truth
  engine.recordGroundTruth(
    clickId,
    saleId,
    timeDeltaMinutes,
    geoMatchScore,
    sentimentScore,
    click.link.platform
  );
  
  // Also save the attribution to database
  await prisma.attribution.create({
    data: {
      userId: click.link.userId,
      clickId: clickId,
      saleId: saleId,
      linkId: click.linkId,
      confidenceScore: 1.0, // 100% - we know this is correct
      status: 'MATCHED',
      timeDeltaMinutes: timeDeltaMinutes,
      matchedBy: {
        smartLink: true,
        ipMatch: click.ipAddress === sale.customerIp,
        geoMatch: geoMatchScore > 0.7,
        timeWindow: true
      }
    }
  });
  
  console.log(`[GroundTruth] Recorded: ${clickId} → ${saleId} (${timeDeltaMinutes}min)`);
}

// ============================================================================
// INTEGRATION 2: Sale Without Link (Probabilistic Attribution)
// ============================================================================

/**
 * Called when a sale happens but NO smart link was clicked
 * Engine uses learned patterns to attribute the sale
 */
export async function attributeSaleWithoutLink(saleId: string) {
  const engine = getAdaptiveEngine();
  
  const sale = await prisma.sale.findUnique({
    where: { id: saleId }
  });
  
  if (!sale) return;
  
  // Get user's recent content (last 24 hours)
  const recentPosts = await prisma.socialPost.findMany({
    where: {
      socialAccount: {
        userId: sale.userId
      },
      postedAt: {
        gte: new Date(sale.createdAt.getTime() - 24 * 60 * 60 * 1000)
      }
    },
    include: {
      socialAccount: true
    }
  });
  
  // Convert to AttributedContent format
  const contentHistory = recentPosts.map(post => ({
    projectId: 'default',
    socialAccountId: post.socialAccountId,
    contentId: post.platformId,
    contentType: post.platform === 'YOUTUBE' ? 'video' as const : 'tweet' as const,
    contentUrl: post.url || undefined,
    contentText: post.content || undefined,
    postedAt: post.postedAt,
    attributionReason: 'broadcast' as const,
    matchedKeywords: [],
    confidence: 0.5,
    likes: post.likes,
    retweets: 0,
    replies: post.comments,
    views: post.views,
    audienceBreakdown: undefined, // TODO: Get from analytics
    manuallyAdjusted: false
  }));
  
  // Run correlation
  const revenueEvent = {
    id: sale.id,
    source: 'stripe' as const,
    amount: sale.amount,
    currency: sale.currency,
    timestamp: sale.createdAt,
    description: sale.productName || 'Product Purchase',
    customerEmail: sale.customerEmail || undefined,
    location: sale.country ? {
      city: sale.city || 'Unknown',
      country: sale.country
    } : undefined
  };
  
  const correlation = engine.correlateEvent(revenueEvent, contentHistory);
  
  // Only save if confidence is high enough
  if (correlation.primaryAttribution && correlation.primaryAttribution.correlationScore >= 0.5) {
    const attr = correlation.primaryAttribution;
    
    await prisma.attribution.create({
      data: {
        userId: sale.userId,
        clickId: 'inferred', // No actual click tracked
        saleId: sale.id,
        linkId: 'inferred', // No smart link
        confidenceScore: attr.correlationScore,
        status: attr.correlationScore >= 0.8 ? 'MATCHED' : 'UNCERTAIN',
        timeDeltaMinutes: attr.timeDifferenceMinutes,
        matchedBy: {
          probabilistic: true,
          geoMatch: attr.locationMatch,
          timeDecay: true
        }
      }
    });
    
    console.log(`[Probabilistic] Attributed sale ${saleId} to content with ${(attr.correlationScore * 100).toFixed(1)}% confidence`);
    
    return correlation.primaryAttribution;
  }
  
  console.log(`[Probabilistic] No strong attribution for sale ${saleId}`);
  return null;
}

// ============================================================================
// INTEGRATION 3: User Feedback Loop
// ============================================================================

/**
 * API endpoint: POST /api/attributions/[id]/confirm
 * User confirms or rejects an attribution
 */
export async function handleAttributionFeedback(
  attributionId: string,
  userConfirmed: boolean
) {
  const engine = getAdaptiveEngine();
  
  const attribution = await prisma.attribution.findUnique({
    where: { id: attributionId },
    include: {
      sale: true,
      click: {
        include: { link: true }
      }
    }
  });
  
  if (!attribution) return;
  
  // Provide feedback to the engine
  engine.provideFeedback({
    saleId: attribution.saleId,
    predictedScore: attribution.confidenceScore,
    actualConverted: userConfirmed,
    features: {
      timeDelta: attribution.timeDeltaMinutes || 0,
      geoScore: 0.5, // TODO: Recalculate from saved data
      sentimentScore: 0.5, // TODO: Get from post sentiment
      platform: attribution.click.link.platform
    }
  });
  
  // Update status
  await prisma.attribution.update({
    where: { id: attributionId },
    data: {
      status: userConfirmed ? 'CONFIRMED' : 'REJECTED'
    }
  });
  
  console.log(`[Feedback] User ${userConfirmed ? 'confirmed' : 'rejected'} attribution ${attributionId}`);
}

// ============================================================================
// INTEGRATION 4: Model Monitoring Dashboard
// ============================================================================

/**
 * API endpoint: GET /api/admin/model-status
 * View current model performance
 */
export function getModelStatus() {
  const engine = getAdaptiveEngine();
  const state = engine.getModelState();
  
  return {
    version: state.weights.version,
    accuracy: state.weights.accuracy,
    trainingDataCount: state.trainingDataCount,
    isLearning: state.isLearning,
    weights: {
      time: state.weights.timeWeight,
      geo: state.weights.geoWeight,
      sentiment: state.weights.sentimentWeight
    },
    lambdas: state.weights.lambdas,
    lastUpdated: state.weights.updatedAt
  };
}

/**
 * API endpoint: POST /api/admin/export-training-data
 * Export training data for analysis
 */
export function exportTrainingData() {
  const engine = getAdaptiveEngine();
  return engine.exportTrainingData();
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateGeoMatch(click: any, sale: any): number {
  if (!click.country || !sale.country) return 0;
  
  let score = 0;
  
  // Country match
  if (click.country === sale.country) {
    score += 0.5;
    
    // City match (stronger signal)
    if (click.city && sale.city && click.city === sale.city) {
      score += 0.5;
    } else if (click.region && sale.region && click.region === sale.region) {
      score += 0.3;
    }
  }
  
  return Math.min(1.0, score);
}

async function getRecentSentiment(platform: string): Promise<number> {
  // TODO: Implement sentiment analysis
  // For now, return neutral
  return 0.5;
}

// ============================================================================
// CRON JOB: Periodic Model Retraining
// ============================================================================

/**
 * Run this daily to retrain the model with all accumulated data
 */
export async function dailyModelRetrain() {
  const engine = getAdaptiveEngine();
  const state = engine.getModelState();
  
  console.log(`[Retrain] Starting with ${state.trainingDataCount} samples...`);
  
  // The engine automatically retrains every 10 samples
  // But we can force a retrain here
  // (Add a public retrain() method if needed)
  
  // Save updated weights to database for persistence
  await saveModelWeights(state.weights);
  
  console.log(`[Retrain] Complete. Accuracy: ${(state.weights.accuracy * 100).toFixed(2)}%`);
}

async function saveModelWeights(weights: any) {
  // TODO: Save to database or Redis cache
  console.log('[Weights] Saved to production');
}
