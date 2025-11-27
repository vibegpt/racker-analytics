/**
 * Racker Insights Engine
 *
 * An adaptive learning system that analyzes link click patterns
 * to generate actionable insights for creators.
 *
 * Key features:
 * - Tracks clicks across dimensions (time, platform, niche, geo)
 * - Learns optimal patterns from conversion data
 * - Generates personalized and aggregate reports
 * - Adapts weights based on ground truth (actual conversions)
 */

import {
  ClickEventInput,
  InsightPattern,
  ModelWeights,
  DEFAULT_WEIGHTS,
  LearningConfig,
  DEFAULT_LEARNING_CONFIG,
  EngineState,
  CreatorReport,
  AggregateQuery,
  AggregateReport,
  TimeInsight,
  PlatformInsight,
  GeoInsight,
  InsightDimension,
  CreatorNiche,
  Platform,
  DAYS_OF_WEEK,
  MONTHS,
} from './types';

// ============================================================================
// IN-MEMORY STORAGE (Replace with Prisma in production)
// ============================================================================

interface StoredEvent extends ClickEventInput {
  id: string;
  hourOfDay: number;
  dayOfWeek: number;
  monthOfYear: number;
  createdAt: Date;
}

// ============================================================================
// INSIGHTS ENGINE
// ============================================================================

export class InsightsEngine {
  private weights: ModelWeights;
  private config: LearningConfig;

  // In-memory stores (would be Prisma in production)
  private events: StoredEvent[] = [];
  private patterns: Map<string, InsightPattern> = new Map();

  // Training state
  private eventsSinceLastTrain = 0;

  constructor(
    initialWeights: ModelWeights = DEFAULT_WEIGHTS,
    config: LearningConfig = DEFAULT_LEARNING_CONFIG
  ) {
    this.weights = { ...initialWeights };
    this.config = config;
  }

  // ==========================================================================
  // EVENT RECORDING
  // ==========================================================================

  /**
   * Record a click event for learning
   */
  recordClick(event: ClickEventInput): string {
    const clickedAt = event.clickedAt || new Date();
    const id = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const storedEvent: StoredEvent = {
      ...event,
      id,
      clickedAt,
      hourOfDay: clickedAt.getHours(),
      dayOfWeek: clickedAt.getDay(),
      monthOfYear: clickedAt.getMonth() + 1,
      createdAt: new Date(),
    };

    this.events.push(storedEvent);
    this.eventsSinceLastTrain++;

    // Update patterns
    this.updatePatterns(storedEvent);

    // Check if we should retrain
    if (this.shouldRetrain()) {
      this.trainWeights();
    }

    // Prune old events
    this.pruneOldEvents();

    return id;
  }

  /**
   * Update a click event when conversion happens
   */
  recordConversion(eventId: string, revenueAmount: number): boolean {
    const event = this.events.find(e => e.id === eventId);
    if (!event) return false;

    event.converted = true;
    event.revenueAmount = revenueAmount;

    // Update patterns with conversion data
    this.updatePatternsForConversion(event);

    return true;
  }

  // ==========================================================================
  // PATTERN TRACKING
  // ==========================================================================

  private getPatternKey(
    dimension: InsightDimension,
    segment: string,
    filters?: { niche?: CreatorNiche; platform?: Platform; country?: string }
  ): string {
    const parts = [dimension, segment];
    if (filters?.niche) parts.push(`n:${filters.niche}`);
    if (filters?.platform) parts.push(`p:${filters.platform}`);
    if (filters?.country) parts.push(`c:${filters.country}`);
    return parts.join('|');
  }

  private updatePatterns(event: StoredEvent): void {
    // Update time_of_day pattern
    this.incrementPattern('time_of_day', String(event.hourOfDay), event);

    // Update day_of_week pattern
    this.incrementPattern('day_of_week', String(event.dayOfWeek), event);

    // Update month pattern
    this.incrementPattern('month', String(event.monthOfYear), event);

    // Update platform pattern
    this.incrementPattern('platform', event.platform, event);

    // Update niche pattern (if available)
    if (event.creatorNiche) {
      this.incrementPattern('niche', event.creatorNiche, event);
    }

    // Update geo pattern
    if (event.visitorCountry) {
      this.incrementPattern('geo', event.visitorCountry, event);
    }

    // Update device pattern
    if (event.deviceType) {
      this.incrementPattern('device', event.deviceType, event);
    }

    // Update content_type pattern
    if (event.contentType) {
      this.incrementPattern('content_type', event.contentType, event);
    }

    // Update combined patterns (niche + platform, niche + time, etc.)
    if (event.creatorNiche) {
      this.incrementPattern('time_of_day', String(event.hourOfDay), event, {
        niche: event.creatorNiche,
      });
      this.incrementPattern('platform', event.platform, event, {
        niche: event.creatorNiche,
      });
    }
  }

  private incrementPattern(
    dimension: InsightDimension,
    segment: string,
    event: StoredEvent,
    filters?: { niche?: CreatorNiche; platform?: Platform; country?: string }
  ): void {
    const key = this.getPatternKey(dimension, segment, filters);

    let pattern = this.patterns.get(key);
    if (!pattern) {
      pattern = {
        dimension,
        segment,
        niche: filters?.niche,
        platform: filters?.platform,
        country: filters?.country,
        totalClicks: 0,
        totalConversions: 0,
        totalRevenue: 0,
        sampleSize: 0,
        conversionRate: 0,
        avgRevenuePerClick: 0,
        performanceScore: 0,
        trend7d: 0,
        trend30d: 0,
        confidence: 0,
      };
    }

    pattern.totalClicks++;
    pattern.sampleSize++;

    if (event.converted) {
      pattern.totalConversions++;
      pattern.totalRevenue += event.revenueAmount || 0;
    }

    // Recalculate scores
    pattern.conversionRate = pattern.totalClicks > 0
      ? pattern.totalConversions / pattern.totalClicks
      : 0;
    pattern.avgRevenuePerClick = pattern.totalClicks > 0
      ? pattern.totalRevenue / pattern.totalClicks
      : 0;

    // Update confidence based on sample size
    pattern.confidence = Math.min(1, pattern.sampleSize / 100);

    this.patterns.set(key, pattern);
  }

  private updatePatternsForConversion(event: StoredEvent): void {
    // Re-process all dimensions for this event with conversion data
    this.updatePatterns(event);
  }

  // ==========================================================================
  // WEIGHT LEARNING
  // ==========================================================================

  private shouldRetrain(): boolean {
    return (
      this.events.length >= this.config.minSamplesBeforeLearning &&
      this.eventsSinceLastTrain >= this.config.retrainEveryNSamples
    );
  }

  private trainWeights(): void {
    // Only train on converted events (ground truth)
    const conversions = this.events.filter(e => e.converted);
    if (conversions.length < 10) return;

    // Calculate feature importance based on conversion correlation
    const featureScores = {
      time: this.calculateFeatureImportance('time_of_day', conversions),
      platform: this.calculateFeatureImportance('platform', conversions),
      niche: this.calculateFeatureImportance('niche', conversions),
      geo: this.calculateFeatureImportance('geo', conversions),
      content: this.calculateFeatureImportance('content_type', conversions),
    };

    // Normalize to sum to 1
    const total = Object.values(featureScores).reduce((a, b) => a + b, 0);
    if (total > 0) {
      // Gradual update using learning rate
      const lr = this.config.learningRate;
      this.weights.timeWeight = this.weights.timeWeight * (1 - lr) + (featureScores.time / total) * lr;
      this.weights.platformWeight = this.weights.platformWeight * (1 - lr) + (featureScores.platform / total) * lr;
      this.weights.nicheWeight = this.weights.nicheWeight * (1 - lr) + (featureScores.niche / total) * lr;
      this.weights.geoWeight = this.weights.geoWeight * (1 - lr) + (featureScores.geo / total) * lr;
      this.weights.contentWeight = this.weights.contentWeight * (1 - lr) + (featureScores.content / total) * lr;

      // Renormalize weights
      const weightSum =
        this.weights.timeWeight +
        this.weights.platformWeight +
        this.weights.nicheWeight +
        this.weights.geoWeight +
        this.weights.contentWeight;

      this.weights.timeWeight /= weightSum;
      this.weights.platformWeight /= weightSum;
      this.weights.nicheWeight /= weightSum;
      this.weights.geoWeight /= weightSum;
      this.weights.contentWeight /= weightSum;
    }

    // Update platform lambdas based on conversion timing
    this.updatePlatformLambdas(conversions);

    // Update metadata
    this.weights.trainingCount++;
    this.weights.updatedAt = new Date();
    this.eventsSinceLastTrain = 0;

    // Bump version
    const [major, minor, patch] = this.weights.version.replace('v', '').split('.').map(Number);
    this.weights.version = `v${major}.${minor}.${patch + 1}`;
  }

  private calculateFeatureImportance(dimension: string, conversions: StoredEvent[]): number {
    // Simple variance-based importance
    // Higher variance in conversion rate across segments = more important feature
    const segments = new Map<string, { clicks: number; conversions: number }>();

    for (const event of this.events) {
      let segment: string | undefined;
      switch (dimension) {
        case 'time_of_day':
          segment = String(event.hourOfDay);
          break;
        case 'platform':
          segment = event.platform;
          break;
        case 'niche':
          segment = event.creatorNiche;
          break;
        case 'geo':
          segment = event.visitorCountry;
          break;
        case 'content_type':
          segment = event.contentType;
          break;
      }

      if (!segment) continue;

      const existing = segments.get(segment) || { clicks: 0, conversions: 0 };
      existing.clicks++;
      if (event.converted) existing.conversions++;
      segments.set(segment, existing);
    }

    // Calculate variance in conversion rates
    const rates: number[] = [];
    for (const { clicks, conversions: conv } of segments.values()) {
      if (clicks >= 5) {
        rates.push(conv / clicks);
      }
    }

    if (rates.length < 2) return 0.1; // Default low importance

    const mean = rates.reduce((a, b) => a + b, 0) / rates.length;
    const variance = rates.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / rates.length;

    // Return normalized variance as importance (0.1 to 1.0)
    return Math.min(1, Math.max(0.1, variance * 10 + 0.1));
  }

  private updatePlatformLambdas(conversions: StoredEvent[]): void {
    // Group conversions by platform and calculate average time to convert
    const platformTimes = new Map<string, number[]>();

    for (const event of conversions) {
      if (!event.revenueAmount) continue;

      const existing = platformTimes.get(event.platform) || [];
      // Assuming conversion happens within a day, use hour as proxy
      existing.push(event.hourOfDay);
      platformTimes.set(event.platform, existing);
    }

    // Update lambdas based on timing patterns
    for (const [platform, times] of platformTimes) {
      if (times.length < 5) continue;

      // Higher variance in timing = lower lambda (content stays relevant longer)
      const mean = times.reduce((a, b) => a + b, 0) / times.length;
      const variance = times.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) / times.length;

      // Map variance to lambda (higher variance = lower lambda)
      const newLambda = Math.max(0.05, Math.min(3.0, 1 / (variance + 1)));

      // Gradual update
      const currentLambda = this.weights.platformLambdas[platform] || 0.5;
      this.weights.platformLambdas[platform] =
        currentLambda * 0.9 + newLambda * 0.1;
    }
  }

  private pruneOldEvents(): void {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - this.config.eventRetentionDays);

    this.events = this.events.filter(e => e.createdAt > cutoff);

    // Also limit total count
    if (this.events.length > this.config.maxEventsToStore) {
      this.events = this.events.slice(-this.config.maxEventsToStore);
    }
  }

  // ==========================================================================
  // INSIGHT GENERATION
  // ==========================================================================

  /**
   * Generate a personalized report for a creator
   */
  generateCreatorReport(
    creatorNiche?: CreatorNiche,
    creatorCountry?: string
  ): CreatorReport {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return {
      generatedAt: now,
      dataRange: { from: thirtyDaysAgo, to: now },
      sampleSize: this.events.length,
      confidence: Math.min(1, this.events.length / 500),

      summary: this.generateSummary(creatorNiche),

      time: this.generateTimeInsights(creatorNiche),
      platforms: this.generatePlatformInsights(creatorNiche),
      niche: creatorNiche ? this.generateNicheInsights(creatorNiche) : undefined,
      geo: this.generateGeoInsights(creatorNiche),

      recommendations: this.generateRecommendations(creatorNiche, creatorCountry),
    };
  }

  /**
   * Generate an aggregate report for a query (e.g., "Travel creators in US")
   */
  generateAggregateReport(query: AggregateQuery): AggregateReport {
    const now = new Date();

    // Build title
    const titleParts: string[] = [];
    if (query.niche) titleParts.push(`${query.niche} Creators`);
    else titleParts.push('All Creators');
    if (query.country) titleParts.push(`in ${query.country}`);
    if (query.platform) titleParts.push(`on ${query.platform}`);

    // Filter events matching query
    const matchingEvents = this.events.filter(e => {
      if (query.niche && e.creatorNiche !== query.niche) return false;
      if (query.country && e.creatorCountry !== query.country) return false;
      if (query.platform && e.platform !== query.platform) return false;
      if (query.dateRange) {
        if (e.clickedAt < query.dateRange.from) return false;
        if (e.clickedAt > query.dateRange.to) return false;
      }
      return true;
    });

    const conversions = matchingEvents.filter(e => e.converted);

    // Calculate findings
    const bestHour = this.findBestSegment('time_of_day', matchingEvents);
    const bestDay = this.findBestSegment('day_of_week', matchingEvents);
    const bestPlatform = this.findBestSegment('platform', matchingEvents);
    const bestContent = this.findBestSegment('content_type', matchingEvents);

    return {
      query,
      generatedAt: now,
      sampleSize: matchingEvents.length,
      confidence: Math.min(1, matchingEvents.length / 200),
      title: titleParts.join(' '),

      findings: {
        bestTimeToPost: {
          hour: parseInt(bestHour.segment) || 12,
          day: DAYS_OF_WEEK[parseInt(bestDay.segment)] || 'tuesday',
          timezone: 'UTC',
        },
        bestPlatform: (bestPlatform.segment as Platform) || 'YOUTUBE',
        avgConversionRate: matchingEvents.length > 0
          ? conversions.length / matchingEvents.length
          : 0,
        avgRevenuePerClick: matchingEvents.length > 0
          ? conversions.reduce((sum, e) => sum + (e.revenueAmount || 0), 0) / matchingEvents.length
          : 0,
        topContentType: bestContent.segment || 'video',
      },

      seasonality: this.generateSeasonality(matchingEvents),
      trends: this.generateTrends(matchingEvents),
      contentTrends: this.generateContentTrends(query.niche),
    };
  }

  private generateSummary(niche?: CreatorNiche): string {
    const conversionRate = this.calculateOverallConversionRate();
    const topPlatform = this.getTopPlatform();

    if (niche) {
      return `Based on ${this.events.length} tracked events, ${niche.toLowerCase()} creators see a ${(conversionRate * 100).toFixed(1)}% conversion rate. ${topPlatform} is currently the top performing platform.`;
    }

    return `Based on ${this.events.length} tracked events, overall conversion rate is ${(conversionRate * 100).toFixed(1)}%. ${topPlatform} is the top performing platform.`;
  }

  private generateTimeInsights(niche?: CreatorNiche): TimeInsight {
    const hourScores: { hour: number; score: number; label: string }[] = [];

    for (let hour = 0; hour < 24; hour++) {
      const key = niche
        ? this.getPatternKey('time_of_day', String(hour), { niche })
        : this.getPatternKey('time_of_day', String(hour));

      const pattern = this.patterns.get(key);
      const score = pattern?.conversionRate || 0;

      const label = hour < 6 ? 'Night' :
                    hour < 12 ? 'Morning' :
                    hour < 18 ? 'Afternoon' : 'Evening';

      hourScores.push({ hour, score, label: `${hour}:00 (${label})` });
    }

    hourScores.sort((a, b) => b.score - a.score);

    const dayScores = DAYS_OF_WEEK.map((day, i) => {
      const key = this.getPatternKey('day_of_week', String(i));
      const pattern = this.patterns.get(key);
      return { day, score: pattern?.conversionRate || 0 };
    });

    dayScores.sort((a, b) => b.score - a.score);

    return {
      bestHours: hourScores.slice(0, 5),
      bestDays: dayScores,
      timezone: 'UTC',
    };
  }

  private generatePlatformInsights(niche?: CreatorNiche): PlatformInsight {
    const platforms: Platform[] = ['TWITTER', 'YOUTUBE', 'INSTAGRAM', 'TIKTOK', 'TWITCH', 'NEWSLETTER'];

    const rankings = platforms.map(platform => {
      const key = niche
        ? this.getPatternKey('platform', platform, { niche })
        : this.getPatternKey('platform', platform);

      const pattern = this.patterns.get(key);

      return {
        platform,
        clicks: pattern?.totalClicks || 0,
        conversions: pattern?.totalConversions || 0,
        conversionRate: pattern?.conversionRate || 0,
        avgRevenue: pattern?.avgRevenuePerClick || 0,
        score: pattern?.performanceScore || 0,
        trend: pattern?.trend7d || 0,
      };
    });

    rankings.sort((a, b) => b.conversionRate - a.conversionRate);

    const top = rankings[0];
    const recommendation = top.clicks > 0
      ? `${top.platform} has the highest conversion rate at ${(top.conversionRate * 100).toFixed(1)}%. Consider focusing your efforts there.`
      : 'Not enough data to make platform recommendations yet.';

    return { rankings, recommendation };
  }

  private generateNicheInsights(niche: CreatorNiche): NicheInsight | undefined {
    const nichePattern = this.patterns.get(this.getPatternKey('niche', niche));
    if (!nichePattern) return undefined;

    // Calculate averages across all niches
    let totalClicks = 0;
    let totalConversions = 0;
    let nicheCount = 0;

    for (const [key, pattern] of this.patterns) {
      if (key.startsWith('niche|')) {
        totalClicks += pattern.totalClicks;
        totalConversions += pattern.totalConversions;
        nicheCount++;
      }
    }

    const avgConversionRate = totalClicks > 0 ? totalConversions / totalClicks : 0;

    return {
      niche,
      clicksVsAvg: nicheCount > 0
        ? ((nichePattern.totalClicks / (totalClicks / nicheCount)) - 1) * 100
        : 0,
      conversionVsAvg: avgConversionRate > 0
        ? ((nichePattern.conversionRate / avgConversionRate) - 1) * 100
        : 0,
      revenueVsAvg: 0, // Would need more data
      trendingTopics: this.getTrendingTopicsForNiche(niche),
      growingPlatforms: this.getGrowingPlatformsForNiche(niche),
      peakSeasons: this.getPeakSeasonsForNiche(niche),
    };
  }

  private generateGeoInsights(niche?: CreatorNiche): GeoInsight {
    const geoPatterns: { country: string; pattern: InsightPattern }[] = [];

    for (const [key, pattern] of this.patterns) {
      if (key.startsWith('geo|')) {
        const country = key.split('|')[1];
        geoPatterns.push({ country, pattern });
      }
    }

    geoPatterns.sort((a, b) => b.pattern.totalClicks - a.pattern.totalClicks);

    return {
      topCountries: geoPatterns.slice(0, 10).map(({ country, pattern }) => ({
        country,
        clicks: pattern.totalClicks,
        conversions: pattern.totalConversions,
        conversionRate: pattern.conversionRate,
        revenue: pattern.totalRevenue,
      })),
      opportunities: [], // Would need market size data
    };
  }

  private generateRecommendations(
    niche?: CreatorNiche,
    country?: string
  ): CreatorReport['recommendations'] {
    const recommendations: CreatorReport['recommendations'] = [];

    const timeInsights = this.generateTimeInsights(niche);
    const platformInsights = this.generatePlatformInsights(niche);

    // Time-based recommendation
    if (timeInsights.bestHours.length > 0 && timeInsights.bestHours[0].score > 0) {
      recommendations.push({
        priority: 'high',
        category: 'Timing',
        insight: `Your audience converts best at ${timeInsights.bestHours[0].label}`,
        action: `Schedule your link shares for around ${timeInsights.bestHours[0].hour}:00 UTC`,
      });
    }

    // Platform recommendation
    if (platformInsights.rankings.length > 0 && platformInsights.rankings[0].clicks > 10) {
      const top = platformInsights.rankings[0];
      const worst = platformInsights.rankings[platformInsights.rankings.length - 1];

      if (top.conversionRate > worst.conversionRate * 1.5) {
        recommendations.push({
          priority: 'high',
          category: 'Platform',
          insight: `${top.platform} converts ${((top.conversionRate / (worst.conversionRate || 0.01)) * 100 - 100).toFixed(0)}% better than ${worst.platform}`,
          action: `Prioritize ${top.platform} for promotional content`,
        });
      }
    }

    // Day of week recommendation
    if (timeInsights.bestDays.length > 0 && timeInsights.bestDays[0].score > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'Timing',
        insight: `${timeInsights.bestDays[0].day} is your best performing day`,
        action: `Plan your most important promotions for ${timeInsights.bestDays[0].day}s`,
      });
    }

    return recommendations;
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  private findBestSegment(
    dimension: InsightDimension,
    events: StoredEvent[]
  ): { segment: string; score: number } {
    const segments = new Map<string, { clicks: number; conversions: number }>();

    for (const event of events) {
      let segment: string | undefined;
      switch (dimension) {
        case 'time_of_day':
          segment = String(event.hourOfDay);
          break;
        case 'day_of_week':
          segment = String(event.dayOfWeek);
          break;
        case 'platform':
          segment = event.platform;
          break;
        case 'content_type':
          segment = event.contentType;
          break;
      }

      if (!segment) continue;

      const existing = segments.get(segment) || { clicks: 0, conversions: 0 };
      existing.clicks++;
      if (event.converted) existing.conversions++;
      segments.set(segment, existing);
    }

    let bestSegment = '';
    let bestScore = 0;

    for (const [segment, { clicks, conversions }] of segments) {
      const score = clicks > 0 ? conversions / clicks : 0;
      if (score > bestScore) {
        bestScore = score;
        bestSegment = segment;
      }
    }

    return { segment: bestSegment, score: bestScore };
  }

  private calculateOverallConversionRate(): number {
    const conversions = this.events.filter(e => e.converted).length;
    return this.events.length > 0 ? conversions / this.events.length : 0;
  }

  private getTopPlatform(): string {
    let topPlatform = 'YOUTUBE';
    let topScore = 0;

    for (const [key, pattern] of this.patterns) {
      if (key.startsWith('platform|')) {
        if (pattern.conversionRate > topScore) {
          topScore = pattern.conversionRate;
          topPlatform = key.split('|')[1];
        }
      }
    }

    return topPlatform;
  }

  private getTrendingTopicsForNiche(niche: CreatorNiche): string[] {
    // Placeholder - would analyze content/campaign tags
    const topics: Record<CreatorNiche, string[]> = {
      TRAVEL: ['camping', 'budget travel', 'digital nomad'],
      GAMING: ['indie games', 'speedrunning', 'game reviews'],
      FITNESS: ['home workouts', 'nutrition', 'recovery'],
      BEAUTY: ['skincare', 'sustainable beauty', 'tutorials'],
      TECH: ['AI tools', 'productivity', 'reviews'],
      FOOD: ['meal prep', 'air fryer recipes', 'restaurant reviews'],
      FASHION: ['thrifting', 'capsule wardrobe', 'sustainable fashion'],
      MUSIC: ['covers', 'production', 'gear reviews'],
      EDUCATION: ['online courses', 'study tips', 'career advice'],
      FINANCE: ['investing', 'budgeting', 'side hustles'],
      LIFESTYLE: ['minimalism', 'productivity', 'wellness'],
      ENTERTAINMENT: ['commentary', 'reactions', 'podcasts'],
      OTHER: [],
    };
    return topics[niche] || [];
  }

  private getGrowingPlatformsForNiche(niche: CreatorNiche): Platform[] {
    // Would analyze trend data - placeholder
    return ['TIKTOK', 'YOUTUBE'];
  }

  private getPeakSeasonsForNiche(niche: CreatorNiche): string[] {
    const seasons: Record<CreatorNiche, string[]> = {
      TRAVEL: ['Summer', 'Holiday Season'],
      GAMING: ['Holiday Season', 'Summer'],
      FITNESS: ['January', 'Spring'],
      BEAUTY: ['Holiday Season', 'Spring'],
      TECH: ['Back to School', 'Holiday Season'],
      FOOD: ['Holiday Season', 'Summer BBQ'],
      FASHION: ['Spring', 'Fall'],
      MUSIC: ['Festival Season', 'Holiday'],
      EDUCATION: ['Back to School', 'New Year'],
      FINANCE: ['Tax Season', 'New Year'],
      LIFESTYLE: ['New Year', 'Spring'],
      ENTERTAINMENT: ['Year-round'],
      OTHER: [],
    };
    return seasons[niche] || [];
  }

  private generateSeasonality(events: StoredEvent[]): AggregateReport['seasonality'] {
    const monthlyData = new Map<number, { clicks: number; conversions: number }>();

    for (const event of events) {
      const month = event.monthOfYear;
      const existing = monthlyData.get(month) || { clicks: 0, conversions: 0 };
      existing.clicks++;
      if (event.converted) existing.conversions++;
      monthlyData.set(month, existing);
    }

    const avgClicks = events.length / 12;

    return MONTHS.map((month, i) => {
      const data = monthlyData.get(i + 1);
      const clicks = data?.clicks || 0;
      const performanceIndex = avgClicks > 0 ? clicks / avgClicks : 1;

      return {
        month,
        performanceIndex,
        trending: [], // Would need content analysis
      };
    });
  }

  private generateTrends(events: StoredEvent[]): AggregateReport['trends'] {
    // Compare last 7 days to previous 7 days
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const recent = events.filter(e => e.clickedAt >= sevenDaysAgo);
    const previous = events.filter(e => e.clickedAt >= fourteenDaysAgo && e.clickedAt < sevenDaysAgo);

    const recentClicks = recent.length;
    const previousClicks = previous.length;
    const clickChange = previousClicks > 0 ? (recentClicks - previousClicks) / previousClicks : 0;

    const recentConversions = recent.filter(e => e.converted).length;
    const previousConversions = previous.filter(e => e.converted).length;
    const conversionChange = previousConversions > 0
      ? (recentConversions - previousConversions) / previousConversions
      : 0;

    return [
      {
        metric: 'Clicks',
        direction: clickChange > 0.05 ? 'up' : clickChange < -0.05 ? 'down' : 'stable',
        change: clickChange * 100,
        period: '7 days',
      },
      {
        metric: 'Conversions',
        direction: conversionChange > 0.05 ? 'up' : conversionChange < -0.05 ? 'down' : 'stable',
        change: conversionChange * 100,
        period: '7 days',
      },
    ];
  }

  private generateContentTrends(niche?: CreatorNiche): AggregateReport['contentTrends'] {
    // Placeholder - would analyze actual content performance
    return [
      { topic: 'Short-form video', momentum: 0.8, examples: ['TikTok clips', 'YouTube Shorts', 'Reels'] },
      { topic: 'Behind the scenes', momentum: 0.6, examples: ['Process videos', 'Day in the life'] },
      { topic: 'Tutorials', momentum: 0.5, examples: ['How-to guides', 'Tips & tricks'] },
    ];
  }

  // ==========================================================================
  // STATE INSPECTION
  // ==========================================================================

  getState(): EngineState {
    return {
      weights: this.weights,
      patternCount: this.patterns.size,
      eventCount: this.events.length,
      isLearning: this.events.length >= this.config.minSamplesBeforeLearning,
      lastTrainingAt: this.weights.updatedAt,
    };
  }

  getWeights(): ModelWeights {
    return { ...this.weights };
  }

  loadWeights(weights: ModelWeights): void {
    this.weights = { ...weights };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let engineInstance: InsightsEngine | null = null;

export function getInsightsEngine(): InsightsEngine {
  if (!engineInstance) {
    engineInstance = new InsightsEngine();
  }
  return engineInstance;
}

export function resetInsightsEngine(): void {
  engineInstance = null;
}
