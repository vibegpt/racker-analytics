/**
 * ENHANCED CORRELATION ENGINE WITH ADAPTIVE LEARNING
 * 
 * Key improvements:
 * 1. Ground Truth Calibration - Uses Smart Links as training data
 * 2. Weight Adjustment - Learns optimal weights from feedback
 * 3. Model Versioning - Tracks performance over time
 * 4. Probabilistic Attribution - Can attribute sales without links
 * 5. Real-time Click Tracking - Warms up model before sales arrive
 */

import { RevenueEvent, RevenueCorrelation, CorrelatedContent } from "./types";
import { AttributedContent } from "../attribution/types";
import { MOCK_LINK_CLICKS, MOCK_SMART_LINKS } from "../links/mock-data";

// ============================================================================
// CLICK EVENT TRACKING
// ============================================================================

export interface ClickEvent {
  id: string;
  linkId: string;
  userId: string;
  slug: string;
  platform: string;
  
  // Matching signals
  ipAddress?: string;
  fingerprint?: string;
  trackerId?: string;
  
  // Geo data
  country?: string;
  region?: string;
  city?: string;
  
  // Context
  referer?: string;
  utmSource?: string;
  utmCampaign?: string;
  
  clickedAt: Date;
  
  // Attribution status
  attributed: boolean;
  saleId?: string;
}

// ============================================================================
// TRAINING DATA STRUCTURES
// ============================================================================

interface GroundTruthSample {
  id: string;
  clickId: string;
  saleId: string;
  
  // Features (what we measure)
  timeDeltaMinutes: number;
  geoMatch: number;           // 0.0 - 1.0
  sentimentScore: number;     // 0.0 - 1.0
  platform: string;
  
  // Target (what we know is true)
  didConvert: boolean;        // Always true for smart links
  
  timestamp: Date;
}

interface ModelWeights {
  version: string;
  timeWeight: number;
  geoWeight: number;
  sentimentWeight: number;
  
  // Platform-specific lambda values
  lambdas: Record<string, number>;
  
  // Performance metrics
  accuracy: number;
  trainingCount: number;
  updatedAt: Date;
}

interface PredictionFeedback {
  saleId: string;
  predictedScore: number;
  actualConverted: boolean;   // Did we get it right?
  features: {
    timeDelta: number;
    geoScore: number;
    sentimentScore: number;
    platform: string;
  };
}

// ============================================================================
// ENHANCED CORRELATION ENGINE
// ============================================================================

export class AdaptiveCorrelationEngine {
  private windowMinutes: number;
  private currentWeights: ModelWeights;
  private trainingData: GroundTruthSample[] = [];
  
  // Learning rate for gradient descent
  private learningRate: number = 0.01;
  
  // Minimum samples before enabling adaptive learning
  private minTrainingSamples: number = 50;
  
  // Real-time click tracking (in-memory cache)
  private recentClicks: Map<string, ClickEvent[]> = new Map(); // userId -> clicks
  private clicksByIp: Map<string, ClickEvent[]> = new Map(); // ip -> clicks
  private clicksByTracker: Map<string, ClickEvent> = new Map(); // trackerId -> click
  private clicksByFingerprint: Map<string, ClickEvent[]> = new Map(); // fingerprint -> clicks
  
  // Max clicks to keep in memory per user
  private maxClicksPerUser: number = 100;
  
  // Click expiry (matches attribution window)
  private clickExpiryMs: number;

  constructor(windowMinutes: number = 24 * 60) {
    this.windowMinutes = windowMinutes;
    this.clickExpiryMs = windowMinutes * 60 * 1000;
    
    // Initialize with domain-expert weights
    this.currentWeights = {
      version: 'v1.0.0',
      timeWeight: 0.5,
      geoWeight: 0.3,
      sentimentWeight: 0.2,
      lambdas: {
        'twitter': 0.5,
        'youtube': 0.1,
        'instagram': 0.3,
        'tiktok': 0.4,
        'twitch': 2.0,
        'default': 0.5
      },
      accuracy: 0.0,
      trainingCount: 0,
      updatedAt: new Date()
    };
    
    // Start cleanup interval (every 5 minutes)
    this.startClickCleanup();
  }
  
  // ==========================================================================
  // REAL-TIME CLICK TRACKING
  // ==========================================================================
  
  /**
   * Record a click event from the Track API
   * This warms up the engine before sales arrive
   */
  recordClick(click: ClickEvent): void {
    const now = Date.now();
    
    // Store by userId
    if (!this.recentClicks.has(click.userId)) {
      this.recentClicks.set(click.userId, []);
    }
    const userClicks = this.recentClicks.get(click.userId)!;
    userClicks.push(click);
    
    // Trim if too many clicks
    if (userClicks.length > this.maxClicksPerUser) {
      userClicks.shift();
    }
    
    // Index by IP for fast lookup
    if (click.ipAddress) {
      if (!this.clicksByIp.has(click.ipAddress)) {
        this.clicksByIp.set(click.ipAddress, []);
      }
      this.clicksByIp.get(click.ipAddress)!.push(click);
    }
    
    // Index by tracker ID
    if (click.trackerId) {
      this.clicksByTracker.set(click.trackerId, click);
    }
    
    // Index by fingerprint
    if (click.fingerprint) {
      if (!this.clicksByFingerprint.has(click.fingerprint)) {
        this.clicksByFingerprint.set(click.fingerprint, []);
      }
      this.clicksByFingerprint.get(click.fingerprint)!.push(click);
    }
    
    console.log(`[AdaptiveEngine] Recorded click ${click.id} for user ${click.userId}`);
  }
  
  /**
   * Find matching clicks for a sale
   * Uses multiple matching strategies with scoring
   */
  findMatchingClicks(
    userId: string,
    saleTime: Date,
    matchingData: {
      ip?: string;
      trackerId?: string;
      fingerprint?: string;
      country?: string;
      city?: string;
    }
  ): { click: ClickEvent; score: number; matchType: string }[] {
    const matches: { click: ClickEvent; score: number; matchType: string }[] = [];
    const windowStart = saleTime.getTime() - this.clickExpiryMs;
    
    // Strategy 1: Exact IP match (highest confidence)
    if (matchingData.ip) {
      const ipClicks = this.clicksByIp.get(matchingData.ip) || [];
      for (const click of ipClicks) {
        if (click.userId === userId && 
            click.clickedAt.getTime() >= windowStart &&
            click.clickedAt.getTime() <= saleTime.getTime() &&
            !click.attributed) {
          matches.push({ click, score: 0.95, matchType: 'ip_exact' });
        }
      }
    }
    
    // Strategy 2: Tracker ID match (cross-session)
    if (matchingData.trackerId) {
      const trackerClick = this.clicksByTracker.get(matchingData.trackerId);
      if (trackerClick && 
          trackerClick.userId === userId &&
          trackerClick.clickedAt.getTime() >= windowStart &&
          trackerClick.clickedAt.getTime() <= saleTime.getTime() &&
          !trackerClick.attributed) {
        // Check if not already added via IP
        if (!matches.some(m => m.click.id === trackerClick.id)) {
          matches.push({ click: trackerClick, score: 0.90, matchType: 'tracker' });
        }
      }
    }
    
    // Strategy 3: Fingerprint match
    if (matchingData.fingerprint) {
      const fpClicks = this.clicksByFingerprint.get(matchingData.fingerprint) || [];
      for (const click of fpClicks) {
        if (click.userId === userId &&
            click.clickedAt.getTime() >= windowStart &&
            click.clickedAt.getTime() <= saleTime.getTime() &&
            !click.attributed &&
            !matches.some(m => m.click.id === click.id)) {
          matches.push({ click, score: 0.80, matchType: 'fingerprint' });
        }
      }
    }
    
    // Strategy 4: Geo match (weakest signal)
    if (matchingData.country && matchingData.city) {
      const userClicks = this.recentClicks.get(userId) || [];
      for (const click of userClicks) {
        if (click.clickedAt.getTime() >= windowStart &&
            click.clickedAt.getTime() <= saleTime.getTime() &&
            click.country === matchingData.country &&
            click.city === matchingData.city &&
            !click.attributed &&
            !matches.some(m => m.click.id === click.id)) {
          matches.push({ click, score: 0.60, matchType: 'geo' });
        }
      }
    }
    
    // Sort by score descending
    matches.sort((a, b) => b.score - a.score);
    
    return matches;
  }
  
  /**
   * Mark a click as attributed to a sale
   */
  markClickAttributed(clickId: string, saleId: string): void {
    // Search all indexes to find and update the click
    for (const clicks of this.recentClicks.values()) {
      const click = clicks.find(c => c.id === clickId);
      if (click) {
        click.attributed = true;
        click.saleId = saleId;
        console.log(`[AdaptiveEngine] Marked click ${clickId} as attributed to sale ${saleId}`);
        return;
      }
    }
  }
  
  /**
   * Get recent unattributed clicks for a user
   */
  getUnattributedClicks(userId: string): ClickEvent[] {
    const now = Date.now();
    const clicks = this.recentClicks.get(userId) || [];
    
    return clicks.filter(c => 
      !c.attributed && 
      (now - c.clickedAt.getTime()) < this.clickExpiryMs
    );
  }
  
  /**
   * Cleanup expired clicks from all indexes
   */
  private cleanupExpiredClicks(): void {
    const now = Date.now();
    let cleaned = 0;
    
    // Clean user clicks
    for (const [userId, clicks] of this.recentClicks) {
      const validClicks = clicks.filter(c => 
        (now - c.clickedAt.getTime()) < this.clickExpiryMs
      );
      cleaned += clicks.length - validClicks.length;
      if (validClicks.length === 0) {
        this.recentClicks.delete(userId);
      } else {
        this.recentClicks.set(userId, validClicks);
      }
    }
    
    // Clean IP index
    for (const [ip, clicks] of this.clicksByIp) {
      const validClicks = clicks.filter(c => 
        (now - c.clickedAt.getTime()) < this.clickExpiryMs
      );
      if (validClicks.length === 0) {
        this.clicksByIp.delete(ip);
      } else {
        this.clicksByIp.set(ip, validClicks);
      }
    }
    
    // Clean tracker index
    for (const [trackerId, click] of this.clicksByTracker) {
      if ((now - click.clickedAt.getTime()) >= this.clickExpiryMs) {
        this.clicksByTracker.delete(trackerId);
      }
    }
    
    // Clean fingerprint index
    for (const [fp, clicks] of this.clicksByFingerprint) {
      const validClicks = clicks.filter(c => 
        (now - c.clickedAt.getTime()) < this.clickExpiryMs
      );
      if (validClicks.length === 0) {
        this.clicksByFingerprint.delete(fp);
      } else {
        this.clicksByFingerprint.set(fp, validClicks);
      }
    }
    
    if (cleaned > 0) {
      console.log(`[AdaptiveEngine] Cleaned ${cleaned} expired clicks`);
    }
  }
  
  /**
   * Start periodic cleanup
   */
  private startClickCleanup(): void {
    // Run cleanup every 5 minutes
    setInterval(() => this.cleanupExpiredClicks(), 5 * 60 * 1000);
  }
  
  /**
   * Get click statistics
   */
  getClickStats(): {
    totalClicks: number;
    unattributedClicks: number;
    uniqueUsers: number;
    uniqueIps: number;
  } {
    let totalClicks = 0;
    let unattributedClicks = 0;
    
    for (const clicks of this.recentClicks.values()) {
      totalClicks += clicks.length;
      unattributedClicks += clicks.filter(c => !c.attributed).length;
    }
    
    return {
      totalClicks,
      unattributedClicks,
      uniqueUsers: this.recentClicks.size,
      uniqueIps: this.clicksByIp.size
    };
  }

  // ==========================================================================
  // GROUND TRUTH CALIBRATION - Record Smart Link Conversions
  // ==========================================================================
  
  /**
   * Called when a Smart Link results in a sale
   * This is our 100% certain "Ground Truth"
   */
  recordGroundTruth(
    clickId: string,
    saleId: string,
    timeDeltaMinutes: number,
    geoMatchScore: number,
    sentimentScore: number,
    platform: string
  ): void {
    const sample: GroundTruthSample = {
      id: `gt_${Date.now()}`,
      clickId,
      saleId,
      timeDeltaMinutes,
      geoMatch: geoMatchScore,
      sentimentScore,
      platform,
      didConvert: true, // Always true for smart links
      timestamp: new Date()
    };
    
    this.trainingData.push(sample);
    
    // Trigger retraining if we have enough samples
    if (this.trainingData.length >= this.minTrainingSamples && 
        this.trainingData.length % 10 === 0) {
      this.retrain();
    }
  }

  // ==========================================================================
  // FEEDBACK LOOP - Learn from Predictions
  // ==========================================================================
  
  /**
   * Provide feedback on a prediction
   * Used for probabilistic attribution (sales without links)
   */
  provideFeedback(feedback: PredictionFeedback): void {
    // Convert feedback into a training sample
    const sample: GroundTruthSample = {
      id: `fb_${Date.now()}`,
      clickId: 'inferred',
      saleId: feedback.saleId,
      timeDeltaMinutes: feedback.features.timeDelta,
      geoMatch: feedback.features.geoScore,
      sentimentScore: feedback.features.sentimentScore,
      platform: feedback.features.platform,
      didConvert: feedback.actualConverted,
      timestamp: new Date()
    };
    
    this.trainingData.push(sample);
    
    // Calculate prediction error for this sample
    const error = feedback.actualConverted ? 1.0 : 0.0 - feedback.predictedScore;
    
    // Immediate weight update (online learning)
    this.updateWeightsOnline(sample, error);
  }

  // ==========================================================================
  // ADAPTIVE WEIGHT ADJUSTMENT
  // ==========================================================================
  
  /**
   * Online learning - Update weights after each feedback
   */
  private updateWeightsOnline(sample: GroundTruthSample, error: number): void {
    const { timeDeltaMinutes, geoMatch, sentimentScore, platform } = sample;
    
    // Calculate time score
    const lambda = this.currentWeights.lambdas[platform] || this.currentWeights.lambdas.default;
    const timeScore = Math.exp(-lambda * (timeDeltaMinutes / 60)); // Convert to hours
    
    // Gradient descent weight updates
    // Loss = (predicted - actual)^2
    // ∂Loss/∂w = 2 * error * feature
    
    const gradient = 2 * error;
    
    // Update weights (gradient descent)
    this.currentWeights.timeWeight += this.learningRate * gradient * timeScore;
    this.currentWeights.geoWeight += this.learningRate * gradient * geoMatch;
    this.currentWeights.sentimentWeight += this.learningRate * gradient * sentimentScore;
    
    // Normalize weights to sum to 1.0
    this.normalizeWeights();
    
    this.currentWeights.trainingCount++;
    this.currentWeights.updatedAt = new Date();
  }

  /**
   * Batch retraining - Optimize weights using all training data
   */
  private retrain(): void {
    if (this.trainingData.length < this.minTrainingSamples) {
      return;
    }
    
    console.log(`[AdaptiveEngine] Retraining with ${this.trainingData.length} samples...`);
    
    // Use gradient descent to find optimal weights
    const iterations = 100;
    let bestWeights = { ...this.currentWeights };
    let bestLoss = this.calculateLoss(bestWeights);
    
    for (let i = 0; i < iterations; i++) {
      // Calculate gradient across all samples
      const gradients = {
        timeWeight: 0,
        geoWeight: 0,
        sentimentWeight: 0
      };
      
      for (const sample of this.trainingData) {
        const predicted = this.predictWithWeights(sample, this.currentWeights);
        const actual = sample.didConvert ? 1.0 : 0.0;
        const error = predicted - actual;
        
        // Accumulate gradients
        const lambda = this.currentWeights.lambdas[sample.platform] || this.currentWeights.lambdas.default;
        const timeScore = Math.exp(-lambda * (sample.timeDeltaMinutes / 60));
        
        gradients.timeWeight += 2 * error * timeScore;
        gradients.geoWeight += 2 * error * sample.geoMatch;
        gradients.sentimentWeight += 2 * error * sample.sentimentScore;
      }
      
      // Average gradients
      const n = this.trainingData.length;
      gradients.timeWeight /= n;
      gradients.geoWeight /= n;
      gradients.sentimentWeight /= n;
      
      // Update weights
      this.currentWeights.timeWeight -= this.learningRate * gradients.timeWeight;
      this.currentWeights.geoWeight -= this.learningRate * gradients.geoWeight;
      this.currentWeights.sentimentWeight -= this.learningRate * gradients.sentimentWeight;
      
      this.normalizeWeights();
      
      // Check if we improved
      const currentLoss = this.calculateLoss(this.currentWeights);
      if (currentLoss < bestLoss) {
        bestLoss = currentLoss;
        bestWeights = { ...this.currentWeights };
      }
    }
    
    // Use best weights found
    this.currentWeights = bestWeights;
    this.currentWeights.accuracy = 1.0 - bestLoss; // Convert loss to accuracy
    this.currentWeights.version = `v${Math.floor(Date.now() / 1000)}`; // Version by timestamp
    this.currentWeights.updatedAt = new Date();
    
    console.log(`[AdaptiveEngine] Retrained! Accuracy: ${(this.currentWeights.accuracy * 100).toFixed(2)}%`);
    console.log(`[AdaptiveEngine] New weights: time=${this.currentWeights.timeWeight.toFixed(3)}, geo=${this.currentWeights.geoWeight.toFixed(3)}, sentiment=${this.currentWeights.sentimentWeight.toFixed(3)}`);
  }

  /**
   * Predict conversion probability for a sample given weights
   */
  private predictWithWeights(sample: GroundTruthSample, weights: ModelWeights): number {
    const { timeDeltaMinutes, geoMatch, sentimentScore, platform } = sample;
    
    const lambda = weights.lambdas[platform] || weights.lambdas.default;
    const timeScore = Math.exp(-lambda * (timeDeltaMinutes / 60));
    
    const prediction = 
      (weights.timeWeight * timeScore) +
      (weights.geoWeight * geoMatch) +
      (weights.sentimentWeight * sentimentScore);
    
    return Math.max(0, Math.min(1, prediction));
  }

  /**
   * Calculate mean squared error loss
   */
  private calculateLoss(weights: ModelWeights): number {
    let totalLoss = 0;
    
    for (const sample of this.trainingData) {
      const predicted = this.predictWithWeights(sample, weights);
      const actual = sample.didConvert ? 1.0 : 0.0;
      const error = predicted - actual;
      totalLoss += error * error;
    }
    
    return totalLoss / this.trainingData.length;
  }

  /**
   * Normalize weights to sum to 1.0
   */
  private normalizeWeights(): void {
    const sum = this.currentWeights.timeWeight + 
                this.currentWeights.geoWeight + 
                this.currentWeights.sentimentWeight;
    
    if (sum > 0) {
      this.currentWeights.timeWeight /= sum;
      this.currentWeights.geoWeight /= sum;
      this.currentWeights.sentimentWeight /= sum;
    }
  }

  // ==========================================================================
  // CORRELATION (Enhanced with Adaptive Weights)
  // ==========================================================================
  
  /**
   * Correlate a single revenue event with content history
   * Now uses adaptive weights learned from ground truth
   */
  correlateEvent(
    event: RevenueEvent,
    contentHistory: AttributedContent[]
  ): RevenueCorrelation {
    const eventTime = event.timestamp.getTime();
    const windowMs = this.windowMinutes * 60 * 1000;

    // 1. Check for Smart Link "Hard Match" (100% Confidence)
    const linkedClick = MOCK_LINK_CLICKS.find(c => c.revenueEventId === event.id);

    if (linkedClick) {
      const smartLink = MOCK_SMART_LINKS.find(l => l.id === linkedClick.linkId);
      const matchingContent = contentHistory.find(c => {
        const platformMatch = c.socialAccountId.includes(smartLink?.platform || '');
        const timeMatch = c.postedAt.getTime() < linkedClick.timestamp.getTime();
        return platformMatch && timeMatch;
      });

      if (matchingContent) {
        const timeDeltaMinutes = Math.round((eventTime - matchingContent.postedAt.getTime()) / 60000);
        
        // Record this as ground truth for training
        const geoScore = this.calculateGeoScore(event, matchingContent);
        const sentimentScore = 0.5; // TODO: Get from sentiment analysis
        
        this.recordGroundTruth(
          linkedClick.id,
          event.id,
          timeDeltaMinutes,
          geoScore,
          sentimentScore,
          smartLink!.platform
        );
        
        return {
          revenueEventId: event.id,
          revenueEvent: event,
          attributedContent: [{
            content: matchingContent,
            timeDifferenceMinutes: timeDeltaMinutes,
            correlationScore: 1.0,
            locationMatch: true,
            smartLinkMatch: {
              linkId: smartLink!.id,
              clickId: linkedClick.id,
              platform: smartLink!.platform
            }
          }],
          primaryAttribution: {
            content: matchingContent,
            timeDifferenceMinutes: timeDeltaMinutes,
            correlationScore: 1.0,
            locationMatch: true,
            smartLinkMatch: {
              linkId: smartLink!.id,
              clickId: linkedClick.id,
              platform: smartLink!.platform
            }
          }
        };
      }
    }

    // 2. PROBABILISTIC ATTRIBUTION using learned weights
    const candidates = contentHistory.filter(content => {
      const contentTime = content.postedAt.getTime();
      return contentTime < eventTime && contentTime > (eventTime - windowMs);
    });

    const attributedContent = candidates.map(content => {
      const diffMs = eventTime - content.postedAt.getTime();
      const timeDeltaMinutes = Math.round(diffMs / 60000);
      const diffHours = diffMs / (1000 * 60 * 60);

      // Get platform-specific lambda
      const platform = this.getPlatformFromContent(content);
      const lambda = this.currentWeights.lambdas[platform] || this.currentWeights.lambdas.default;
      const timeScore = Math.exp(-lambda * diffHours);

      // Calculate geo score
      const geoScore = this.calculateGeoScore(event, content);

      // Get sentiment score (placeholder)
      const sentimentScore = 0.5; // TODO: Integrate real sentiment analysis

      // Use LEARNED weights instead of hardcoded ones
      const finalScore = 
        (this.currentWeights.timeWeight * timeScore) +
        (this.currentWeights.geoWeight * geoScore) +
        (this.currentWeights.sentimentWeight * sentimentScore);

      return {
        content,
        timeDifferenceMinutes: timeDeltaMinutes,
        correlationScore: Math.max(0, Math.min(1, finalScore)),
        locationMatch: geoScore > 0.1,
        smartLinkMatch: undefined
      };
    });

    // Sort by score
    attributedContent.sort((a, b) => b.correlationScore - a.correlationScore);

    return {
      revenueEventId: event.id,
      revenueEvent: event,
      attributedContent: attributedContent,
      primaryAttribution: attributedContent.length > 0 ? attributedContent[0] : undefined
    };
  }

  /**
   * Calculate geo overlap score
   */
  private calculateGeoScore(event: RevenueEvent, content: AttributedContent): number {
    if (!event.location || !content.audienceBreakdown) {
      return 0;
    }
    
    const buyerCity = event.location.city;
    const match = content.audienceBreakdown.find(l => l.city === buyerCity);
    
    if (match) {
      // Jaccard-ish: If > 10% of audience is from buyer's city, strong signal
      return Math.min(1.0, match.percentage * 5);
    }
    
    return 0;
  }

  /**
   * Extract platform from content
   */
  private getPlatformFromContent(content: AttributedContent): string {
    // Simple heuristic - in production, would be a field
    if (content.socialAccountId.includes('twitter')) return 'twitter';
    if (content.socialAccountId.includes('youtube')) return 'youtube';
    if (content.socialAccountId.includes('twitch')) return 'twitch';
    if (content.socialAccountId.includes('instagram')) return 'instagram';
    if (content.socialAccountId.includes('tiktok')) return 'tiktok';
    return 'default';
  }

  // ==========================================================================
  // MODEL INSPECTION & DEBUGGING
  // ==========================================================================
  
  /**
   * Get current model state for debugging
   */
  getModelState() {
    return {
      weights: this.currentWeights,
      trainingDataCount: this.trainingData.length,
      isLearning: this.trainingData.length >= this.minTrainingSamples
    };
  }

  /**
   * Export training data for analysis
   */
  exportTrainingData(): GroundTruthSample[] {
    return [...this.trainingData];
  }

  /**
   * Load pre-trained weights (for production)
   */
  loadWeights(weights: ModelWeights): void {
    this.currentWeights = weights;
  }

  /**
   * Batch correlate multiple events
   */
  batchCorrelate(
    events: RevenueEvent[],
    contentHistory: AttributedContent[]
  ): RevenueCorrelation[] {
    return events.map(event => this.correlateEvent(event, contentHistory));
  }
}
