/**
 * Attribution Engine
 *
 * Core service for attributing social content to creator projects.
 * Implements confidence-based matching using cashtags, hashtags,
 * platform-specific rules, and manual review queuing.
 */

import {
  parseCashtags,
  parseHashtags,
  matchKeywords,
  extractSignals,
  matchesTokenSymbol,
} from './parsers';

import type {
  RawContent,
  Project,
  ProjectSocialLink,
  AttributionResult,
  AttributedContent,
  AttributionReason,
  ConfidenceLevel,
  AttributionConfig,
  AttributionMode,
} from './types';

/**
 * Default attribution configuration
 */
const DEFAULT_CONFIG: AttributionConfig = {
  displayThreshold: 0.75,      // Only show ≥75% confidence
  saveThreshold: 0.50,          // Save ≥50% confidence for manual review
  enableCashtagMatch: true,
  enableHashtagMatch: true,
  enableNameMatch: true,
  enablePlatformRules: true,
  platformRules: {
    twitter: {
      platform: 'twitter',
      defaultConfidence: 0.00,
      requiresExplicitMatch: true,
      autoAttributeAll: false,
    },
    pumpfun: {
      platform: 'pumpfun',
      defaultConfidence: 1.00,
      requiresExplicitMatch: false,
      autoAttributeAll: true,      // All content = their token
    },
    zora: {
      platform: 'zora',
      defaultConfidence: 1.00,      // Creator coin always affected
      requiresExplicitMatch: false,
      autoAttributeAll: true,
    },
    youtube: {
      platform: 'youtube',
      defaultConfidence: 0.00,
      requiresExplicitMatch: true,
      autoAttributeAll: false,
    },
    twitch: {
      platform: 'twitch',
      defaultConfidence: 0.00,
      requiresExplicitMatch: true,
      autoAttributeAll: false,
    },
    instagram: {
      platform: 'instagram',
      defaultConfidence: 0.00,
      requiresExplicitMatch: true,
      autoAttributeAll: false,
    },
    tiktok: {
      platform: 'tiktok',
      defaultConfidence: 0.00,
      requiresExplicitMatch: true,
      autoAttributeAll: false,
    },
    discord: {
      platform: 'discord',
      defaultConfidence: 0.00,
      requiresExplicitMatch: true,
      autoAttributeAll: false,
    },
  },
};

/**
 * Attribution Engine Class
 *
 * Processes raw content and attributes it to projects based on
 * keywords, platform rules, and confidence scoring.
 */
export class AttributionEngine {
  private config: AttributionConfig;

  constructor(config: Partial<AttributionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Attribute content to projects
   *
   * Main entry point: takes raw content and list of user's projects,
   * returns attribution results for each matching project.
   *
   * @param content - Raw content from social platform
   * @param projects - User's projects to match against
   * @param socialLinks - Social account links for this user
   * @returns Array of attribution results (one per matched project)
   */
  async attributeContent(
    content: RawContent,
    projects: Project[],
    socialLinks: ProjectSocialLink[]
  ): Promise<AttributionResult[]> {
    const results: AttributionResult[] = [];

    // Find the social account this content is from
    const socialLink = socialLinks.find(
      link =>
        link.platform === content.platform &&
        link.platformUserId === content.authorId
    );

    if (!socialLink) {
      // Content is from an unconnected account - skip
      return results;
    }

    // Check each project for attribution
    for (const project of projects) {
      const projectLinks = socialLinks.filter(
        link => link.projectId === project.id
      );

      const attribution = await this.attributeToProject(
        content,
        project,
        projectLinks,
        socialLink
      );

      if (attribution) {
        results.push(attribution);
      }
    }

    return results;
  }

  /**
   * Attribute content to a specific project
   *
   * Determines if content should be attributed to this project
   * based on keywords, platform rules, and attribution mode.
   *
   * @returns Attribution result if matched, null otherwise
   */
  private async attributeToProject(
    content: RawContent,
    project: Project,
    projectLinks: ProjectSocialLink[],
    socialLink: ProjectSocialLink
  ): Promise<AttributionResult | null> {
    // Check if this social account is linked to this project
    const isLinked = projectLinks.some(
      link => link.socialAccountId === socialLink.socialAccountId
    );

    if (!isLinked) {
      return null; // Not linked to this project
    }

    // Get the link configuration for this project
    const linkConfig = projectLinks.find(
      link => link.socialAccountId === socialLink.socialAccountId
    );

    if (!linkConfig) {
      return null;
    }

    // Apply platform-specific rules first
    const platformResult = this.checkPlatformRules(
      content,
      project,
      linkConfig
    );

    if (platformResult) {
      return platformResult;
    }

    // Apply keyword matching
    const keywordResult = this.checkKeywordMatch(
      content,
      project,
      linkConfig
    );

    return keywordResult;
  }

  /**
   * Check platform-specific attribution rules
   *
   * Handles special cases like Pump.fun (all content = their token)
   * and Zora (all streams = creator coin).
   */
  private checkPlatformRules(
    content: RawContent,
    project: Project,
    linkConfig: ProjectSocialLink
  ): AttributionResult | null {
    const platformRule = this.config.platformRules[content.platform];

    if (!platformRule || !this.config.enablePlatformRules) {
      return null;
    }

    // PUMP.FUN RULE: All content = their token (100% confidence)
    if (content.platform === 'pumpfun' && platformRule.autoAttributeAll) {
      return {
        projectId: project.id,
        projectName: project.name,
        confidence: 1.00,
        reason: 'pumpfun_stream',
        matchedKeywords: {
          platform: 'pumpfun',
          account: linkConfig.username,
          tokenAddress: project.tokenAddress,
          rule: 'ONE_CREATOR_ONE_TOKEN',
        },
        shouldDisplay: true,
        requiresManualReview: false,
      };
    }

    // ZORA RULE: All streams = creator coin (100% confidence)
    if (
      content.platform === 'zora' &&
      platformRule.autoAttributeAll &&
      (content.contentType === 'stream' || content.contentType === 'video')
    ) {
      // Check if this is a content coin match (75% confidence)
      const contentCoinMatch = this.checkZoraContentCoin(content, project);

      if (contentCoinMatch) {
        return contentCoinMatch; // Return the content coin match (75%)
      }

      // Default: Creator coin match (100%)
      return {
        projectId: project.id,
        projectName: project.name,
        confidence: 1.00,
        reason: 'zora_creator_stream',
        matchedKeywords: {
          platform: 'zora',
          account: linkConfig.username,
          streamType: 'creator',
        },
        shouldDisplay: true,
        requiresManualReview: false,
      };
    }

    // BROADCAST MODE: All content from this account = this project (100%)
    if (linkConfig.attributionMode === 'broadcast') {
      return {
        projectId: project.id,
        projectName: project.name,
        confidence: 1.00,
        reason: 'broadcast',
        matchedKeywords: {
          mode: 'broadcast',
          account: linkConfig.username,
        },
        shouldDisplay: true,
        requiresManualReview: false,
      };
    }

    return null;
  }

  /**
   * Check for Zora content coin matches
   *
   * If a Zora stream mentions specific content (song title, art name, etc.)
   * that has its own content coin, attribute with 75% confidence.
   */
  private checkZoraContentCoin(
    content: RawContent,
    project: Project
  ): AttributionResult | null {
    // This requires checking if the stream title/description mentions
    // a content name that matches this project

    // For MVP, we'll check if the project name appears in the stream title
    const text = content.text || '';
    const projectNameInContent = text
      .toLowerCase()
      .includes(project.name.toLowerCase());

    if (projectNameInContent) {
      return {
        projectId: project.id,
        projectName: project.name,
        confidence: 0.75,
        reason: 'zora_content_match',
        matchedKeywords: [project.name],
        shouldDisplay: true,
        requiresManualReview: false,
      };
    }

    return null;
  }

  /**
   * Check keyword-based attribution
   *
   * Matches cashtags, hashtags, and project name mentions
   * with appropriate confidence levels.
   */
  private checkKeywordMatch(
    content: RawContent,
    project: Project,
    linkConfig: ProjectSocialLink
  ): AttributionResult | null {
    const text = content.text || '';

    if (!text) {
      return null; // No text to match against
    }

    // Only apply keyword matching if attribution mode allows it
    if (linkConfig.attributionMode !== 'mentions_only' && linkConfig.attributionMode !== 'primary') {
      return null; // Broadcast mode already handled by platform rules
    }

    // Match keywords
    const match = matchKeywords(text, project.keywords);

    if (match.highestConfidence === 0.00) {
      return null; // No match found
    }

    // Determine attribution reason based on match type
    let reason: AttributionReason;
    let matchedKeywords: string[];

    if (match.cashtags.length > 0) {
      reason = 'cashtag';
      matchedKeywords = match.cashtags;
    } else if (match.hashtags.length > 0) {
      reason = 'hashtag';
      matchedKeywords = match.hashtags;
    } else if (match.names.length > 0) {
      reason = 'project_name_mention';
      matchedKeywords = match.names;
    } else {
      return null;
    }

    // Build attribution result
    return {
      projectId: project.id,
      projectName: project.name,
      confidence: match.highestConfidence,
      reason,
      matchedKeywords,
      shouldDisplay: match.highestConfidence >= this.config.displayThreshold,
      requiresManualReview:
        match.highestConfidence >= 0.50 &&
        match.highestConfidence < this.config.displayThreshold,
    };
  }

  /**
   * Convert attribution result to database-ready format
   *
   * Prepares the attributed content for saving to the database.
   */
  toAttributedContent(
    content: RawContent,
    attribution: AttributionResult,
    socialAccountId: string
  ): AttributedContent {
    return {
      projectId: attribution.projectId,
      socialAccountId,

      contentId: content.contentId,
      contentType: content.contentType,
      contentUrl: content.url,

      contentText: content.text,
      postedAt: content.postedAt,

      attributionReason: attribution.reason,
      matchedKeywords: attribution.matchedKeywords,
      confidence: attribution.confidence,

      likes: content.likes,
      retweets: content.retweets,
      replies: content.replies,
      views: content.views,
      shares: content.shares,
      comments: content.comments,

      engagementData: content.metadata,

      manuallyAdjusted: false,
    };
  }

  /**
   * Batch attribute multiple pieces of content
   *
   * Processes an array of content and returns all attributions.
   */
  async batchAttributeContent(
    contents: RawContent[],
    projects: Project[],
    socialLinks: ProjectSocialLink[]
  ): Promise<Map<string, AttributionResult[]>> {
    const results = new Map<string, AttributionResult[]>();

    for (const content of contents) {
      const attributions = await this.attributeContent(
        content,
        projects,
        socialLinks
      );

      if (attributions.length > 0) {
        results.set(content.contentId, attributions);
      }
    }

    return results;
  }
}

/**
 * Create a default attribution engine instance
 */
export function createAttributionEngine(
  config?: Partial<AttributionConfig>
): AttributionEngine {
  return new AttributionEngine(config);
}

/**
 * Helper: Get attribution confidence label
 */
export function getConfidenceLabel(confidence: number): string {
  if (confidence >= 1.00) return 'Certain';
  if (confidence >= 0.90) return 'Very High';
  if (confidence >= 0.75) return 'High';
  if (confidence >= 0.50) return 'Medium';
  return 'Low';
}

/**
 * Helper: Get attribution reason display text
 */
export function getReasonLabel(reason: AttributionReason): string {
  const labels: Record<AttributionReason, string> = {
    cashtag: 'Cashtag Match',
    hashtag: 'Hashtag Match',
    broadcast: 'Broadcast Mode',
    pumpfun_stream: 'Pump.fun Stream',
    zora_creator_stream: 'Zora Creator Stream',
    zora_content_match: 'Zora Content Match',
    project_name_mention: 'Project Name Mentioned',
    manual_override: 'Manual Override',
  };

  return labels[reason] || reason;
}
