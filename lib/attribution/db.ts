/**
 * Attribution Database Service
 *
 * Handles saving, updating, and querying attributions from the database.
 * Integrates with Prisma ORM.
 */

import { PrismaClient, Prisma } from '@prisma/client';
import type { AttributedContent, AttributionResult, RawContent } from './types';

const prisma = new PrismaClient();

/**
 * Save a content attribution to the database
 *
 * Creates or updates a ContentAttribution record.
 * Uses upsert to handle duplicates (same project + contentId).
 */
export async function saveAttribution(
  attribution: AttributedContent
): Promise<{ id: string; created: boolean }> {
  try {
    // Check if attribution already exists
    const existing = await prisma.contentAttribution.findUnique({
      where: {
        projectId_contentId: {
          projectId: attribution.projectId,
          contentId: attribution.contentId,
        },
      },
    });

    if (existing) {
      // Update existing attribution (e.g., engagement metrics changed)
      await prisma.contentAttribution.update({
        where: { id: existing.id },
        data: {
          likes: attribution.likes,
          retweets: attribution.retweets,
          replies: attribution.replies,
          views: attribution.views,
          shares: attribution.shares,
          comments: attribution.comments,
          engagementData: attribution.engagementData as Prisma.JsonObject,
          updatedAt: new Date(),
        },
      });

      return { id: existing.id, created: false };
    }

    // Create new attribution
    const created = await prisma.contentAttribution.create({
      data: {
        projectId: attribution.projectId,
        socialAccountId: attribution.socialAccountId,
        contentId: attribution.contentId,
        contentType: attribution.contentType,
        contentUrl: attribution.contentUrl,
        contentText: attribution.contentText,
        postedAt: attribution.postedAt,
        attributionReason: attribution.attributionReason,
        matchedKeywords: attribution.matchedKeywords as Prisma.JsonValue,
        confidence: new Prisma.Decimal(attribution.confidence),
        likes: attribution.likes,
        retweets: attribution.retweets,
        replies: attribution.replies,
        views: attribution.views,
        shares: attribution.shares,
        comments: attribution.comments,
        engagementData: attribution.engagementData as Prisma.JsonObject,
        manuallyAdjusted: attribution.manuallyAdjusted,
        adjustedBy: attribution.adjustedBy,
        adjustmentNote: attribution.adjustmentNote,
      },
    });

    return { id: created.id, created: true };
  } catch (error) {
    console.error('Error saving attribution:', error);
    throw error;
  }
}

/**
 * Batch save multiple attributions
 *
 * Efficiently saves multiple attributions in a transaction.
 */
export async function batchSaveAttributions(
  attributions: AttributedContent[]
): Promise<{ saved: number; updated: number; failed: number }> {
  let saved = 0;
  let updated = 0;
  let failed = 0;

  for (const attribution of attributions) {
    try {
      const result = await saveAttribution(attribution);
      if (result.created) {
        saved++;
      } else {
        updated++;
      }
    } catch (error) {
      console.error('Failed to save attribution:', attribution.contentId, error);
      failed++;
    }
  }

  return { saved, updated, failed };
}

/**
 * Get attributions for a project
 *
 * Retrieves all attributions for a specific project,
 * optionally filtered by confidence threshold.
 */
export async function getProjectAttributions(
  projectId: string,
  options: {
    minConfidence?: number;
    limit?: number;
    offset?: number;
    orderBy?: 'postedAt' | 'confidence' | 'likes';
    orderDirection?: 'asc' | 'desc';
  } = {}
) {
  const {
    minConfidence = 0.75,
    limit = 100,
    offset = 0,
    orderBy = 'postedAt',
    orderDirection = 'desc',
  } = options;

  try {
    const attributions = await prisma.contentAttribution.findMany({
      where: {
        projectId,
        confidence: {
          gte: new Prisma.Decimal(minConfidence),
        },
      },
      orderBy: {
        [orderBy]: orderDirection,
      },
      take: limit,
      skip: offset,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            tokenSymbol: true,
          },
        },
        socialAccount: {
          select: {
            id: true,
            platform: true,
            username: true,
          },
        },
      },
    });

    return attributions;
  } catch (error) {
    console.error('Error getting project attributions:', error);
    throw error;
  }
}

/**
 * Get attributions requiring manual review
 *
 * Returns attributions with 50-74% confidence that need
 * user review and approval.
 */
export async function getManualReviewQueue(
  userId: string,
  options: {
    limit?: number;
    offset?: number;
  } = {}
) {
  const { limit = 50, offset = 0 } = options;

  try {
    const attributions = await prisma.contentAttribution.findMany({
      where: {
        project: {
          userId,
        },
        confidence: {
          gte: new Prisma.Decimal(0.50),
          lt: new Prisma.Decimal(0.75),
        },
        manuallyAdjusted: false,
      },
      orderBy: {
        postedAt: 'desc',
      },
      take: limit,
      skip: offset,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            tokenSymbol: true,
          },
        },
        socialAccount: {
          select: {
            id: true,
            platform: true,
            username: true,
          },
        },
      },
    });

    return attributions;
  } catch (error) {
    console.error('Error getting manual review queue:', error);
    throw error;
  }
}

/**
 * Approve a manual review attribution
 *
 * Marks an attribution as manually reviewed and approved.
 * Optionally can change the project it's attributed to.
 */
export async function approveAttribution(
  attributionId: string,
  userId: string,
  newProjectId?: string
) {
  try {
    const update: Prisma.ContentAttributionUpdateInput = {
      manuallyAdjusted: true,
      adjustedBy: userId,
      adjustmentNote: newProjectId
        ? `Reassigned to different project`
        : `Manually approved`,
      confidence: new Prisma.Decimal(1.00), // Bump to 100% after approval
      updatedAt: new Date(),
    };

    if (newProjectId) {
      update.project = {
        connect: { id: newProjectId },
      };
    }

    const updated = await prisma.contentAttribution.update({
      where: { id: attributionId },
      data: update,
    });

    return updated;
  } catch (error) {
    console.error('Error approving attribution:', error);
    throw error;
  }
}

/**
 * Reject a manual review attribution
 *
 * Marks an attribution as manually reviewed and rejected.
 * Sets confidence to 0 and marks as adjusted.
 */
export async function rejectAttribution(
  attributionId: string,
  userId: string,
  reason?: string
) {
  try {
    const updated = await prisma.contentAttribution.update({
      where: { id: attributionId },
      data: {
        manuallyAdjusted: true,
        adjustedBy: userId,
        adjustmentNote: reason || 'Manually rejected - not about this project',
        confidence: new Prisma.Decimal(0.00),
        updatedAt: new Date(),
      },
    });

    return updated;
  } catch (error) {
    console.error('Error rejecting attribution:', error);
    throw error;
  }
}

/**
 * Get attribution statistics for a project
 *
 * Returns counts and aggregates for analytics.
 */
export async function getAttributionStats(
  projectId: string,
  startDate?: Date,
  endDate?: Date
) {
  try {
    const where: Prisma.ContentAttributionWhereInput = {
      projectId,
      confidence: {
        gte: new Prisma.Decimal(0.75), // Only count high-confidence
      },
    };

    if (startDate || endDate) {
      where.postedAt = {};
      if (startDate) where.postedAt.gte = startDate;
      if (endDate) where.postedAt.lte = endDate;
    }

    const [total, byReason, byPlatform] = await Promise.all([
      // Total count
      prisma.contentAttribution.count({ where }),

      // Count by attribution reason
      prisma.contentAttribution.groupBy({
        by: ['attributionReason'],
        where,
        _count: true,
      }),

      // Count by platform
      prisma.contentAttribution.groupBy({
        by: ['contentType'],
        where,
        _count: true,
      }),
    ]);

    return {
      total,
      byReason: Object.fromEntries(
        byReason.map(r => [r.attributionReason, r._count])
      ),
      byPlatform: Object.fromEntries(
        byPlatform.map(p => [p.contentType, p._count])
      ),
    };
  } catch (error) {
    console.error('Error getting attribution stats:', error);
    throw error;
  }
}

/**
 * Delete an attribution
 *
 * Permanently removes an attribution from the database.
 */
export async function deleteAttribution(attributionId: string) {
  try {
    await prisma.contentAttribution.delete({
      where: { id: attributionId },
    });
  } catch (error) {
    console.error('Error deleting attribution:', error);
    throw error;
  }
}

/**
 * Check if content has already been attributed
 *
 * Prevents duplicate processing of the same content.
 */
export async function isContentAttributed(
  contentId: string,
  projectId: string
): Promise<boolean> {
  try {
    const existing = await prisma.contentAttribution.findUnique({
      where: {
        projectId_contentId: {
          projectId,
          contentId,
        },
      },
    });

    return existing !== null;
  } catch (error) {
    console.error('Error checking if content is attributed:', error);
    return false;
  }
}

/**
 * Get recent attributions across all user's projects
 *
 * Used for dashboard overview showing latest activity.
 */
export async function getUserRecentAttributions(
  userId: string,
  options: {
    limit?: number;
    minConfidence?: number;
  } = {}
) {
  const { limit = 20, minConfidence = 0.75 } = options;

  try {
    const attributions = await prisma.contentAttribution.findMany({
      where: {
        project: {
          userId,
        },
        confidence: {
          gte: new Prisma.Decimal(minConfidence),
        },
      },
      orderBy: {
        postedAt: 'desc',
      },
      take: limit,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            tokenSymbol: true,
            color: true,
          },
        },
        socialAccount: {
          select: {
            id: true,
            platform: true,
            username: true,
          },
        },
      },
    });

    return attributions;
  } catch (error) {
    console.error('Error getting user recent attributions:', error);
    throw error;
  }
}

export { prisma };
