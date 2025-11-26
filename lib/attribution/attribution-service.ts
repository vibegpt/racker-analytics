/**
 * ATTRIBUTION SERVICE (Enhanced for Segment 4)
 * 
 * Connects Smart Link clicks to Stripe sales using the Adaptive Engine.
 * This is the bridge between tracking and revenue attribution.
 * 
 * Enhancements:
 * - Tracker ID matching (cross-session attribution)
 * - Fingerprint matching (device-based fallback)
 * - Multi-signal confidence scoring
 * - Better metadata extraction from sales
 */

import { PrismaClient, Attribution, Click, Sale, SmartLink } from "@prisma/client";
import { AdaptiveCorrelationEngine } from "../correlation/adaptive-engine";
import { RevenueEvent, CorrelatedContent } from "../correlation/types";
import { AttributedContent } from "./types";
import { 
  findBestMatchForSale as findRedisBestMatch, 
  markClickAttributed as markRedisClickAttributed,
  getCacheStats,
  findClickByTracker as findRedisClickByTracker
} from "../cache/click-cache";

const prisma = new PrismaClient();

// ============================================================================
// SINGLETON ENGINE INSTANCE
// ============================================================================

let engineInstance: AdaptiveCorrelationEngine | null = null;

export function getAdaptiveEngine(): AdaptiveCorrelationEngine {
  if (!engineInstance) {
    engineInstance = new AdaptiveCorrelationEngine(24 * 60); // 24 hour window
    console.log('[AttributionService] Initialized Adaptive Engine');
  }
  return engineInstance;
}

// ============================================================================
// TYPES
// ============================================================================

export interface AttributionResult {
  attributed: boolean;
  attribution?: Attribution;
  confidence: number;
  matchType: 'smart_link' | 'tracker' | 'fingerprint' | 'ip' | 'geo' | 'probabilistic' | 'none';
  matchedClick?: Click;
  matchedLink?: SmartLink;
  matchDetails?: {
    tier: 'engine' | 'redis' | 'database';
    signals: string[];
    timeDeltaMinutes?: number;
  };
}

export interface MatchingSignals {
  ip?: string;
  trackerId?: string;
  fingerprint?: string;
  country?: string;
  region?: string;
  city?: string;
}

// ============================================================================
// SIGNAL EXTRACTION FROM SALE
// ============================================================================

/**
 * Extract all matching signals from a sale record
 * Pulls from direct fields and embedded metadata
 */
function extractMatchingSignals(sale: Sale): MatchingSignals {
  const signals: MatchingSignals = {
    ip: sale.customerIp || undefined,
    country: sale.country || undefined,
    region: sale.region || undefined,
    city: sale.city || undefined,
  };

  // Extract from metadata (stored by webhook from Stripe)
  const metadata = sale.metadata as Record<string, any> | null;
  if (metadata) {
    // Direct metadata fields
    signals.trackerId = signals.trackerId || 
      metadata.tracker_id || 
      metadata.rckr_id || 
      metadata.trackerId;
    
    signals.fingerprint = signals.fingerprint || 
      metadata.fingerprint || 
      metadata.fp;

    // Check _extracted nested object (from our enhanced webhook)
    if (metadata._extracted) {
      signals.trackerId = signals.trackerId || metadata._extracted.trackerId;
      signals.fingerprint = signals.fingerprint || metadata._extracted.fingerprint;
    }
  }

  console.log(`[AttributionService] Extracted signals: ip=${signals.ip}, tracker=${signals.trackerId}, fp=${signals.fingerprint}, country=${signals.country}`);
  
  return signals;
}

// ============================================================================
// CONFIDENCE SCORING
// ============================================================================

interface ConfidenceFactors {
  ipMatch: boolean;
  trackerMatch: boolean;
  fingerprintMatch: boolean;
  geoMatch: boolean;
  timeWindowMinutes: number;
}

/**
 * Calculate confidence score based on multiple matching signals
 * Multiple signals boost confidence
 */
function calculateConfidence(factors: ConfidenceFactors): number {
  let score = 0;
  let signalCount = 0;

  // IP match is strongest signal
  if (factors.ipMatch) {
    score += 0.50;
    signalCount++;
  }

  // Tracker ID is very reliable (persistent cookie)
  if (factors.trackerMatch) {
    score += 0.35;
    signalCount++;
  }

  // Fingerprint is good but can have collisions
  if (factors.fingerprintMatch) {
    score += 0.25;
    signalCount++;
  }

  // Geo match is supportive but weak alone
  if (factors.geoMatch) {
    score += 0.15;
    signalCount++;
  }

  // Time decay - closer is better
  const hoursElapsed = factors.timeWindowMinutes / 60;
  if (hoursElapsed <= 1) {
    score += 0.10; // Very recent - boost
  } else if (hoursElapsed <= 4) {
    score += 0.05; // Same session likely
  }

  // Multi-signal bonus: having multiple signals increases confidence
  if (signalCount >= 3) {
    score += 0.10; // Strong multi-signal correlation
  } else if (signalCount >= 2) {
    score += 0.05; // Good correlation
  }

  // Cap at 1.0 (or 0.99 if no IP match for slight uncertainty)
  const maxScore = factors.ipMatch ? 1.0 : 0.95;
  return Math.min(maxScore, score);
}

/**
 * Determine match type based on strongest signal
 */
function determineMatchType(factors: ConfidenceFactors): AttributionResult['matchType'] {
  if (factors.ipMatch) return 'ip';
  if (factors.trackerMatch) return 'tracker';
  if (factors.fingerprintMatch) return 'fingerprint';
  if (factors.geoMatch) return 'geo';
  return 'none';
}

// ============================================================================
// MAIN ATTRIBUTION FUNCTIONS
// ============================================================================

/**
 * Attribute a Stripe sale to content/clicks
 * Called from the Stripe webhook when a payment succeeds
 */
export async function attributeSale(
  sale: Sale,
  options: {
    windowMinutes?: number;
    minConfidence?: number;
  } = {}
): Promise<AttributionResult> {
  const { windowMinutes = 24 * 60, minConfidence = 0.5 } = options;
  const engine = getAdaptiveEngine();

  console.log(`[AttributionService] Attributing sale ${sale.id} ($${sale.amount / 100})`);

  // Extract all matching signals from the sale
  const signals = extractMatchingSignals(sale);

  // Step 1: Try exact match (uses multi-tier lookup)
  const exactMatch = await findExactMatch(sale, signals, windowMinutes);
  
  if (exactMatch) {
    console.log(`[AttributionService] Found exact match: click ${exactMatch.click.id} (${exactMatch.matchType})`);
    
    const timeDelta = Math.floor(
      (sale.createdAt.getTime() - exactMatch.click.clickedAt.getTime()) / 60000
    );
    
    // Calculate confidence based on all matching factors
    const factors: ConfidenceFactors = {
      ipMatch: exactMatch.click.ipAddress === signals.ip && !!signals.ip,
      trackerMatch: exactMatch.matchType === 'tracker' || 
        (exactMatch.click as any).trackerId === signals.trackerId,
      fingerprintMatch: exactMatch.matchType === 'fingerprint',
      geoMatch: exactMatch.click.country === signals.country && !!signals.country,
      timeWindowMinutes: timeDelta,
    };
    
    const confidence = calculateConfidence(factors);
    
    // Record as ground truth for model training
    const geoScore = calculateGeoScore(exactMatch.click, sale);
    const sentimentScore = 0.5; // TODO: Get from recent post sentiment
    
    engine.recordGroundTruth(
      exactMatch.click.id,
      sale.id,
      timeDelta,
      geoScore,
      sentimentScore,
      exactMatch.link.platform.toLowerCase()
    );
    
    // Build matched signals list for logging
    const matchedSignals: string[] = [];
    if (factors.ipMatch) matchedSignals.push('ip');
    if (factors.trackerMatch) matchedSignals.push('tracker');
    if (factors.fingerprintMatch) matchedSignals.push('fingerprint');
    if (factors.geoMatch) matchedSignals.push('geo');

    // Create attribution record
    const attribution = await prisma.attribution.create({
      data: {
        userId: sale.userId,
        clickId: exactMatch.click.id,
        saleId: sale.id,
        linkId: exactMatch.link.id,
        confidenceScore: confidence,
        status: confidence >= 0.8 ? 'MATCHED' : 'UNCERTAIN',
        timeDeltaMinutes: timeDelta,
        revenueShare: 1.0,
        matchedBy: {
          smartLink: true,
          ipMatch: factors.ipMatch,
          trackerMatch: factors.trackerMatch,
          fingerprintMatch: factors.fingerprintMatch,
          geoMatch: factors.geoMatch,
          timeWindow: timeDelta <= windowMinutes,
          tier: exactMatch.tier,
          matchType: exactMatch.matchType,
          signals: matchedSignals,
        }
      }
    });

    return {
      attributed: true,
      attribution,
      confidence,
      matchType: exactMatch.matchType as AttributionResult['matchType'],
      matchedClick: exactMatch.click,
      matchedLink: exactMatch.link,
      matchDetails: {
        tier: exactMatch.tier,
        signals: matchedSignals,
        timeDeltaMinutes: timeDelta,
      }
    };
  }

  // Step 2: Try probabilistic attribution
  console.log(`[AttributionService] No exact match, trying probabilistic...`);
  
  const probabilisticResult = await tryProbabilisticAttribution(
    sale,
    engine,
    windowMinutes,
    minConfidence
  );

  return probabilisticResult;
}

// ============================================================================
// EXACT MATCHING (Smart Link Click → Sale)
// ============================================================================

interface ExactMatch {
  click: Click;
  link: SmartLink;
  tier: 'engine' | 'redis' | 'database';
  matchType: string;
  score: number;
}

async function findExactMatch(
  sale: Sale,
  signals: MatchingSignals,
  windowMinutes: number
): Promise<ExactMatch | null> {
  const windowStart = new Date(sale.createdAt.getTime() - windowMinutes * 60 * 1000);
  const engine = getAdaptiveEngine();

  // =========================================================================
  // TIER 1: In-memory Adaptive Engine (fastest, ~0.1ms)
  // =========================================================================
  const engineMatches = engine.findMatchingClicks(
    sale.userId,
    sale.createdAt,
    {
      ip: signals.ip,
      trackerId: signals.trackerId,
      fingerprint: signals.fingerprint,
      country: signals.country,
      city: signals.city,
    }
  );

  if (engineMatches.length > 0) {
    const bestMatch = engineMatches[0];
    console.log(`[AttributionService] TIER 1 Engine match: ${bestMatch.matchType} (score: ${bestMatch.score.toFixed(2)})`);
    
    // Fetch the full click and link from database
    const click = await prisma.click.findUnique({
      where: { id: bestMatch.click.id },
      include: { link: true }
    });

    if (click) {
      // Mark as attributed in the engine
      engine.markClickAttributed(click.id, sale.id);
      return { 
        click, 
        link: click.link, 
        tier: 'engine', 
        matchType: bestMatch.matchType,
        score: bestMatch.score 
      };
    }
  }

  // =========================================================================
  // TIER 2: Redis Cache (fast, ~1-5ms, shared across instances)
  // =========================================================================
  console.log(`[AttributionService] TIER 2: Trying Redis cache...`);
  
  // Try tracker ID first in Redis (highest priority for cross-session)
  if (signals.trackerId) {
    const trackerClick = await findRedisClickByTracker(signals.trackerId);
    if (trackerClick && 
        trackerClick.userId === sale.userId && 
        !trackerClick.attributed) {
      const clickTime = new Date(trackerClick.clickedAt).getTime();
      if (clickTime >= windowStart.getTime() && clickTime <= sale.createdAt.getTime()) {
        console.log(`[AttributionService] TIER 2 Redis tracker match: ${trackerClick.clickId}`);
        
        const click = await prisma.click.findUnique({
          where: { id: trackerClick.clickId },
          include: { link: true }
        });

        if (click) {
          await markRedisClickAttributed(click.id, sale.id);
          engine.markClickAttributed(click.id, sale.id);
          return { 
            click, 
            link: click.link, 
            tier: 'redis', 
            matchType: 'tracker',
            score: 0.90 
          };
        }
      }
    }
  }
  
  // Try general Redis matching
  const redisMatch = await findRedisBestMatch(
    sale.userId,
    sale.createdAt,
    {
      ip: signals.ip,
      trackerId: signals.trackerId,
      fingerprint: signals.fingerprint,
      country: signals.country,
      city: signals.city,
    }
  );

  if (redisMatch) {
    console.log(`[AttributionService] TIER 2 Redis match: ${redisMatch.matchType} (score: ${redisMatch.score.toFixed(2)})`);
    
    const click = await prisma.click.findUnique({
      where: { id: redisMatch.click.clickId },
      include: { link: true }
    });

    if (click) {
      await markRedisClickAttributed(click.id, sale.id);
      engine.markClickAttributed(click.id, sale.id);
      return { 
        click, 
        link: click.link, 
        tier: 'redis', 
        matchType: redisMatch.matchType.replace('redis_', ''),
        score: redisMatch.score 
      };
    }
  }

  // =========================================================================
  // TIER 3: Database Query (slowest, ~10-50ms, but complete data)
  // =========================================================================
  console.log(`[AttributionService] TIER 3: Querying database...`);

  // Strategy 1: Match by IP address (most reliable)
  if (signals.ip) {
    const clickByIp = await prisma.click.findFirst({
      where: {
        ipAddress: signals.ip,
        clickedAt: {
          gte: windowStart,
          lte: sale.createdAt
        },
        link: {
          userId: sale.userId
        }
      },
      include: { link: true },
      orderBy: { clickedAt: 'desc' }
    });

    if (clickByIp) {
      console.log(`[AttributionService] TIER 3 Database IP match: ${clickByIp.id}`);
      return { 
        click: clickByIp, 
        link: clickByIp.link, 
        tier: 'database', 
        matchType: 'ip',
        score: 0.95 
      };
    }
  }

  // Strategy 2: Match by geo (weaker signal)
  if (signals.country && signals.city) {
    const clickByGeo = await prisma.click.findFirst({
      where: {
        country: signals.country,
        city: signals.city,
        clickedAt: {
          gte: windowStart,
          lte: sale.createdAt
        },
        link: {
          userId: sale.userId
        }
      },
      include: { link: true },
      orderBy: { clickedAt: 'desc' }
    });

    if (clickByGeo) {
      console.log(`[AttributionService] TIER 3 Database geo match: ${clickByGeo.id}`);
      return { 
        click: clickByGeo, 
        link: clickByGeo.link, 
        tier: 'database', 
        matchType: 'geo',
        score: 0.60 
      };
    }
  }

  return null;
}

// ============================================================================
// PROBABILISTIC ATTRIBUTION (No Smart Link Click)
// ============================================================================

async function tryProbabilisticAttribution(
  sale: Sale,
  engine: AdaptiveCorrelationEngine,
  windowMinutes: number,
  minConfidence: number
): Promise<AttributionResult> {
  const windowStart = new Date(sale.createdAt.getTime() - windowMinutes * 60 * 1000);

  // Get user's recent social posts
  const recentPosts = await prisma.socialPost.findMany({
    where: {
      socialAccount: {
        userId: sale.userId
      },
      postedAt: {
        gte: windowStart,
        lte: sale.createdAt
      }
    },
    include: {
      socialAccount: true
    },
    orderBy: { postedAt: 'desc' }
  });

  if (recentPosts.length === 0) {
    console.log(`[AttributionService] No recent posts found for user ${sale.userId}`);
    return {
      attributed: false,
      confidence: 0,
      matchType: 'none'
    };
  }

  // Convert posts to AttributedContent format
  const contentHistory: AttributedContent[] = recentPosts.map(post => ({
    projectId: 'default',
    socialAccountId: post.socialAccountId,
    contentId: post.platformId,
    contentType: mapPlatformToContentType(post.platform),
    contentUrl: post.url || undefined,
    contentText: post.content || undefined,
    postedAt: post.postedAt,
    attributionReason: 'broadcast' as const,
    matchedKeywords: [],
    confidence: 0.5,
    likes: post.likes,
    retweets: post.shares,
    replies: post.comments,
    views: post.views,
    audienceBreakdown: undefined,
    manuallyAdjusted: false
  }));

  // Create revenue event
  const revenueEvent: RevenueEvent = {
    id: sale.id,
    source: 'stripe',
    amount: sale.amount / 100, // Convert cents to dollars
    currency: sale.currency,
    timestamp: sale.createdAt,
    description: sale.productName || 'Product Purchase',
    customerEmail: sale.customerEmail || undefined,
    location: sale.country ? {
      city: sale.city || 'Unknown',
      country: sale.country
    } : undefined
  };

  // Run correlation engine
  const correlation = engine.correlateEvent(revenueEvent, contentHistory);

  if (!correlation.primaryAttribution) {
    console.log(`[AttributionService] No attribution found for sale ${sale.id}`);
    return {
      attributed: false,
      confidence: 0,
      matchType: 'none'
    };
  }

  const attr = correlation.primaryAttribution;
  
  if (attr.correlationScore < minConfidence) {
    console.log(`[AttributionService] Attribution confidence too low: ${(attr.correlationScore * 100).toFixed(1)}%`);
    return {
      attributed: false,
      confidence: attr.correlationScore,
      matchType: 'probabilistic'
    };
  }

  // Find or create a virtual "inferred" click for this attribution
  const inferredClick = await prisma.click.create({
    data: {
      linkId: await getOrCreateInferredLink(sale.userId),
      clickedAt: new Date(sale.createdAt.getTime() - attr.timeDifferenceMinutes * 60000),
      ipAddress: sale.customerIp,
      country: sale.country,
      city: sale.city,
      deviceType: 'inferred',
      browser: 'inferred',
      os: 'inferred'
    }
  });

  const inferredLink = await prisma.smartLink.findFirst({
    where: { userId: sale.userId, slug: { startsWith: 'inferred-' } }
  });

  // Create attribution
  const attribution = await prisma.attribution.create({
    data: {
      userId: sale.userId,
      clickId: inferredClick.id,
      saleId: sale.id,
      linkId: inferredLink!.id,
      confidenceScore: attr.correlationScore,
      status: attr.correlationScore >= 0.8 ? 'MATCHED' : 'UNCERTAIN',
      timeDeltaMinutes: attr.timeDifferenceMinutes,
      revenueShare: 1.0,
      matchedBy: {
        probabilistic: true,
        contentId: attr.content.contentId,
        platform: attr.content.socialAccountId,
        geoMatch: attr.locationMatch,
        timeDecay: true
      }
    }
  });

  console.log(`[AttributionService] Probabilistic attribution: ${(attr.correlationScore * 100).toFixed(1)}% confidence`);

  return {
    attributed: true,
    attribution,
    confidence: attr.correlationScore,
    matchType: 'probabilistic',
    matchedClick: inferredClick,
    matchedLink: inferredLink!,
    matchDetails: {
      tier: 'engine',
      signals: ['time', 'content', attr.locationMatch ? 'geo' : ''].filter(Boolean),
      timeDeltaMinutes: attr.timeDifferenceMinutes,
    }
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateGeoScore(click: Click, sale: Sale): number {
  if (!click.country || !sale.country) return 0;
  
  let score = 0;
  
  if (click.country === sale.country) {
    score += 0.5;
    
    if (click.city && sale.city && click.city === sale.city) {
      score += 0.5;
    } else if (click.region && sale.region && click.region === sale.region) {
      score += 0.3;
    }
  }
  
  return Math.min(1.0, score);
}

function mapPlatformToContentType(platform: string): 'tweet' | 'video' | 'post' | 'stream' {
  switch (platform.toUpperCase()) {
    case 'TWITTER':
      return 'tweet';
    case 'YOUTUBE':
    case 'TIKTOK':
      return 'video';
    case 'TWITCH':
      return 'stream';
    default:
      return 'post';
  }
}

async function getOrCreateInferredLink(userId: string): Promise<string> {
  let inferredLink = await prisma.smartLink.findFirst({
    where: {
      userId,
      slug: { startsWith: 'inferred-' }
    }
  });

  if (!inferredLink) {
    inferredLink = await prisma.smartLink.create({
      data: {
        userId,
        slug: `inferred-${userId.slice(0, 8)}`,
        originalUrl: 'https://internal.racker.io/inferred',
        platform: 'OTHER',
        active: false,
        notes: 'System-generated link for probabilistic attributions'
      }
    });
  }

  return inferredLink.id;
}

// ============================================================================
// FEEDBACK & TRAINING
// ============================================================================

/**
 * Process user feedback on an attribution
 */
export async function processAttributionFeedback(
  attributionId: string,
  userConfirmed: boolean
): Promise<void> {
  const engine = getAdaptiveEngine();

  const attribution = await prisma.attribution.findUnique({
    where: { id: attributionId },
    include: {
      click: { include: { link: true } },
      sale: true
    }
  });

  if (!attribution) {
    throw new Error(`Attribution ${attributionId} not found`);
  }

  // Provide feedback to the engine
  engine.provideFeedback({
    saleId: attribution.saleId,
    predictedScore: attribution.confidenceScore,
    actualConverted: userConfirmed,
    features: {
      timeDelta: attribution.timeDeltaMinutes || 0,
      geoScore: calculateGeoScore(attribution.click, attribution.sale),
      sentimentScore: 0.5,
      platform: attribution.click.link.platform.toLowerCase()
    }
  });

  // Update attribution status
  await prisma.attribution.update({
    where: { id: attributionId },
    data: {
      status: userConfirmed ? 'CONFIRMED' : 'REJECTED'
    }
  });

  console.log(`[AttributionService] Feedback recorded: ${userConfirmed ? 'confirmed' : 'rejected'}`);
}

// ============================================================================
// MODEL STATUS
// ============================================================================

export function getModelStatus() {
  const engine = getAdaptiveEngine();
  const state = engine.getModelState();
  const clickStats = engine.getClickStats();

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
    lastUpdated: state.weights.updatedAt,
    clickTracking: {
      totalClicks: clickStats.totalClicks,
      unattributedClicks: clickStats.unattributedClicks,
      uniqueUsers: clickStats.uniqueUsers,
      uniqueIps: clickStats.uniqueIps
    }
  };
}

/**
 * Get extended status including Redis cache stats
 */
export async function getExtendedModelStatus() {
  const baseStatus = getModelStatus();
  const cacheStats = await getCacheStats();
  
  return {
    ...baseStatus,
    redisCache: cacheStats
  };
}

/**
 * Get unattributed clicks for a user
 */
export function getUnattributedClicksForUser(userId: string) {
  const engine = getAdaptiveEngine();
  return engine.getUnattributedClicks(userId);
}

/**
 * Re-export ClickEvent type
 */
export type { ClickEvent } from '../correlation/adaptive-engine';
