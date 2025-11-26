/**
 * Attribution Engine Types
 *
 * Defines interfaces for content attribution, confidence scoring,
 * and platform-specific logic.
 */

export type Platform = 'twitter' | 'pumpfun' | 'zora' | 'youtube' | 'twitch' | 'instagram' | 'tiktok' | 'discord';

export type ContentType = 'tweet' | 'stream' | 'video' | 'post' | 'story' | 'retweet' | 'reply';

export type AttributionMode = 'broadcast' | 'mentions_only' | 'primary';

export type AttributionReason =
  | 'cashtag'
  | 'hashtag'
  | 'broadcast'
  | 'pumpfun_stream'
  | 'zora_creator_stream'
  | 'zora_content_match'
  | 'project_name_mention'
  | 'manual_override';

export type ConfidenceLevel = 1.00 | 0.90 | 0.75 | 0.50 | 0.00;

/**
 * Raw content from social platforms before attribution
 */
export interface RawContent {
  // Identity
  contentId: string;           // Unique ID from platform (tweet ID, video ID, etc.)
  platform: Platform;
  contentType: ContentType;

  // Content
  text?: string;               // Tweet text, post caption, video title
  url?: string;                // Direct link to content

  // Metadata
  postedAt: Date;
  authorId: string;            // Platform user ID
  authorUsername: string;

  // Engagement (snapshot at ingestion)
  likes?: number;
  retweets?: number;
  replies?: number;
  views?: number;
  shares?: number;
  comments?: number;

  // Platform-specific metadata
  metadata?: Record<string, any>;
}

/**
 * Project configuration for attribution
 */
export interface Project {
  id: string;
  userId: string;
  name: string;
  tokenSymbol?: string;        // "WOLF", "DTV", "BIRDIE"
  tokenAddress?: string;
  blockchain?: string;
  isPrimary: boolean;

  // Attribution keywords
  keywords: string[];          // ["$WOLF", "#WOLF", "#WolfToken", "Wolf Token"]

  // Social account links
  socialLinks: ProjectSocialLink[];
}

/**
 * Social account linked to a project
 */
export interface ProjectSocialLink {
  projectId: string;
  socialAccountId: string;
  platform: Platform;
  platformUserId: string;
  username: string;
  attributionMode: AttributionMode;
}

/**
 * Matched keywords/signals found in content
 */
export interface MatchResult {
  matched: boolean;
  matchType: AttributionReason;
  confidence: ConfidenceLevel;
  keywords: string[];          // Matched cashtags, hashtags, etc.
  metadata?: Record<string, any>; // Platform-specific attribution data
}

/**
 * Attribution result for a piece of content
 */
export interface AttributionResult {
  projectId: string;
  projectName: string;
  confidence: ConfidenceLevel;
  reason: AttributionReason;
  matchedKeywords: string[] | Record<string, any>;
  shouldDisplay: boolean;      // True if ≥75% confidence
  requiresManualReview: boolean; // True if 50-74% confidence
}

/**
 * Final attributed content ready for database
 */
export interface AttributedContent {
  // Foreign keys
  projectId: string;
  socialAccountId: string;

  // Content identity
  contentId: string;
  contentType: ContentType;
  contentUrl?: string;

  // Content metadata
  contentText?: string;
  postedAt: Date;

  // Attribution
  attributionReason: AttributionReason;
  matchedKeywords: string[] | Record<string, any>;
  confidence: number;          // 0.50 - 1.00


  // Engagement metrics
  likes?: number;
  retweets?: number;
  replies?: number;
  views?: number;

  shares?: number;
  comments?: number;

  audienceBreakdown?: { city: string; country: string; percentage: number }[]; // City-level viewer breakdown

  engagementData?: Record<string, any>;

  // Flags
  manuallyAdjusted: boolean;
  adjustedBy?: string;
  adjustmentNote?: string;
}

/**
 * Platform-specific attribution rules
 */
export interface PlatformRule {
  platform: Platform;
  defaultConfidence: ConfidenceLevel;
  requiresExplicitMatch: boolean; // True if needs cashtag/hashtag
  autoAttributeAll: boolean;      // True for pump.fun (all content = their token)
}

/**
 * Configuration for attribution engine
 */
export interface AttributionConfig {
  // Minimum confidence to display on dashboard
  displayThreshold: number;    // Default: 0.75

  // Minimum confidence to save to database
  saveThreshold: number;        // Default: 0.50

  // Enable/disable specific match types
  enableCashtagMatch: boolean;
  enableHashtagMatch: boolean;
  enableNameMatch: boolean;
  enablePlatformRules: boolean;

  // Platform-specific rules
  platformRules: Record<Platform, PlatformRule>;
}
