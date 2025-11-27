/**
 * Racker Insights Engine - Type Definitions
 *
 * Types for tracking and learning from link performance data
 * to generate actionable insights for creators.
 */

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export type CreatorNiche =
  | 'TRAVEL' | 'GAMING' | 'FITNESS' | 'BEAUTY' | 'TECH'
  | 'FOOD' | 'FASHION' | 'MUSIC' | 'EDUCATION' | 'FINANCE'
  | 'LIFESTYLE' | 'ENTERTAINMENT' | 'OTHER';

export type Platform =
  | 'TWITTER' | 'YOUTUBE' | 'INSTAGRAM' | 'TIKTOK'
  | 'TWITCH' | 'NEWSLETTER' | 'DISCORD' | 'OTHER';

export type InsightDimension =
  | 'time_of_day'      // 0-23 hours
  | 'day_of_week'      // 0-6 (Sunday-Saturday)
  | 'month'            // 1-12
  | 'platform'         // TWITTER, YOUTUBE, etc.
  | 'niche'            // TRAVEL, GAMING, etc.
  | 'geo'              // Country codes
  | 'content_type'     // video, post, stream, short
  | 'device';          // mobile, desktop, tablet

export const DAYS_OF_WEEK = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
export const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'] as const;

// ============================================================================
// CLICK EVENT (Input to the engine)
// ============================================================================

export interface ClickEventInput {
  linkId: string;
  platform: Platform;

  // Creator context
  creatorNiche?: CreatorNiche;
  creatorCountry?: string;

  // Time context
  clickedAt: Date;

  // Visitor context
  visitorCountry?: string;
  visitorRegion?: string;
  deviceType?: 'mobile' | 'desktop' | 'tablet';

  // Content context
  contentType?: 'video' | 'post' | 'stream' | 'short' | 'story';

  // Outcome (can be updated later)
  converted?: boolean;
  revenueAmount?: number; // cents
}

// ============================================================================
// INSIGHT PATTERNS (Learned from data)
// ============================================================================

export interface InsightPattern {
  dimension: InsightDimension;
  segment: string;

  // Optional filters
  niche?: CreatorNiche;
  platform?: Platform;
  country?: string;

  // Metrics
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  sampleSize: number;

  // Calculated scores
  conversionRate: number;
  avgRevenuePerClick: number;
  performanceScore: number; // 0-1 normalized

  // Trends
  trend7d: number;
  trend30d: number;

  // Confidence
  confidence: number;
}

// ============================================================================
// MODEL WEIGHTS (Learned over time)
// ============================================================================

export interface ModelWeights {
  version: string;

  // Feature weights
  timeWeight: number;
  platformWeight: number;
  nicheWeight: number;
  geoWeight: number;
  contentWeight: number;

  // Platform-specific time decay (lambda)
  platformLambdas: Record<string, number>;

  // Training stats
  trainingCount: number;
  accuracy: number;
  updatedAt: Date;
}

export const DEFAULT_WEIGHTS: ModelWeights = {
  version: 'v1.0.0',
  timeWeight: 0.3,
  platformWeight: 0.25,
  nicheWeight: 0.2,
  geoWeight: 0.15,
  contentWeight: 0.1,
  platformLambdas: {
    TWITTER: 0.5,     // Fast decay (24h half-life)
    YOUTUBE: 0.1,     // Slow decay (7d half-life, evergreen)
    INSTAGRAM: 0.3,   // Medium decay
    TIKTOK: 0.4,      // Fast but viral potential
    TWITCH: 2.0,      // Very fast (live content)
    NEWSLETTER: 0.2,  // Medium-slow
    DISCORD: 0.6,     // Fast (chat ephemeral)
    OTHER: 0.3,
  },
  trainingCount: 0,
  accuracy: 0,
  updatedAt: new Date(),
};

// ============================================================================
// INSIGHT REPORTS (Output for users)
// ============================================================================

export interface TimeInsight {
  bestHours: { hour: number; score: number; label: string }[];
  bestDays: { day: string; score: number }[];
  bestMonths?: { month: string; score: number }[];
  timezone?: string;
}

export interface PlatformInsight {
  rankings: {
    platform: Platform;
    clicks: number;
    conversions: number;
    conversionRate: number;
    avgRevenue: number;
    score: number;
    trend: number;
  }[];
  recommendation: string;
}

export interface NicheInsight {
  niche: CreatorNiche;
  subNiche?: string;

  // Benchmarks vs other creators in niche
  clicksVsAvg: number;      // +/- percentage
  conversionVsAvg: number;
  revenueVsAvg: number;

  // Trends in this niche
  trendingTopics: string[];
  growingPlatforms: Platform[];
  peakSeasons: string[];
}

export interface GeoInsight {
  topCountries: {
    country: string;
    clicks: number;
    conversions: number;
    conversionRate: number;
    revenue: number;
  }[];

  // Opportunity countries (high potential, low current traffic)
  opportunities: {
    country: string;
    nichePopularity: number;
    currentPenetration: number;
  }[];
}

export interface CreatorReport {
  generatedAt: Date;
  dataRange: { from: Date; to: Date };
  sampleSize: number;
  confidence: number;

  summary: string;

  time: TimeInsight;
  platforms: PlatformInsight;
  niche?: NicheInsight;
  geo: GeoInsight;

  // Actionable recommendations
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    category: string;
    insight: string;
    action: string;
  }[];
}

// ============================================================================
// AGGREGATE REPORTS (For "Travel creators in US" type queries)
// ============================================================================

export interface AggregateQuery {
  niche?: CreatorNiche;
  subNiche?: string;
  country?: string;
  platform?: Platform;
  dateRange?: { from: Date; to: Date };
}

export interface AggregateReport {
  query: AggregateQuery;
  generatedAt: Date;
  sampleSize: number;
  confidence: number;

  // Title like "Travel Creators in the US"
  title: string;

  // Key findings
  findings: {
    bestTimeToPost: { hour: number; day: string; timezone: string };
    bestPlatform: Platform;
    avgConversionRate: number;
    avgRevenuePerClick: number;
    topContentType: string;
  };

  // Seasonal trends
  seasonality: {
    month: string;
    performanceIndex: number; // 1.0 = average, 1.5 = 50% above avg
    trending: string[];
  }[];

  // Growth trends
  trends: {
    metric: string;
    direction: 'up' | 'down' | 'stable';
    change: number;
    period: string;
  }[];

  // Content suggestions
  contentTrends: {
    topic: string;
    momentum: number;
    examples: string[];
  }[];
}

// ============================================================================
// ENGINE STATE
// ============================================================================

export interface EngineState {
  weights: ModelWeights;
  patternCount: number;
  eventCount: number;
  isLearning: boolean;
  lastTrainingAt?: Date;
  nextTrainingAt?: Date;
}

export interface LearningConfig {
  minSamplesBeforeLearning: number;
  retrainEveryNSamples: number;
  learningRate: number;
  maxEventsToStore: number;
  eventRetentionDays: number;
}

export const DEFAULT_LEARNING_CONFIG: LearningConfig = {
  minSamplesBeforeLearning: 50,
  retrainEveryNSamples: 100,
  learningRate: 0.01,
  maxEventsToStore: 100000,
  eventRetentionDays: 90,
};
