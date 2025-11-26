/**
 * MODEL STATUS API
 * 
 * GET /api/analytics/model - Get adaptive attribution model status
 * 
 * Returns:
 * - Model version and accuracy
 * - Current weights (time, geo, sentiment)
 * - Training data count
 * - Real-time click tracking stats
 * - Redis cache status
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { 
  getExtendedModelStatus, 
  getAdaptiveEngine,
  getUnattributedClicksForUser 
} from "@/lib/attribution/attribution-service";

export async function GET(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get user's internal ID
    const user = await db.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get model status
    const status = await getExtendedModelStatus();
    const engine = getAdaptiveEngine();
    const modelState = engine.getModelState();

    // Get user-specific stats
    const unattributedClicks = getUnattributedClicksForUser(user.id);
    
    // Get attribution stats for this user (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalAttributions,
      confirmedAttributions,
      rejectedAttributions,
      avgConfidence
    ] = await Promise.all([
      db.attribution.count({
        where: { userId: user.id, createdAt: { gte: thirtyDaysAgo } }
      }),
      db.attribution.count({
        where: { userId: user.id, status: "CONFIRMED", createdAt: { gte: thirtyDaysAgo } }
      }),
      db.attribution.count({
        where: { userId: user.id, status: "REJECTED", createdAt: { gte: thirtyDaysAgo } }
      }),
      db.attribution.aggregate({
        where: { userId: user.id, createdAt: { gte: thirtyDaysAgo } },
        _avg: { confidenceScore: true }
      })
    ]);

    // Calculate user-specific accuracy based on feedback
    const feedbackCount = confirmedAttributions + rejectedAttributions;
    const userAccuracy = feedbackCount > 0 
      ? confirmedAttributions / feedbackCount 
      : null;

    return NextResponse.json({
      // Global model info
      model: {
        version: status.version,
        globalAccuracy: status.accuracy,
        isLearning: status.isLearning,
        trainingDataCount: status.trainingDataCount,
        lastUpdated: status.lastUpdated
      },

      // Current weights
      weights: {
        time: {
          value: status.weights.time,
          description: "Weight for time decay (how recently the click occurred)"
        },
        geo: {
          value: status.weights.geo,
          description: "Weight for geographic match (click location vs sale location)"
        },
        sentiment: {
          value: status.weights.sentiment,
          description: "Weight for content sentiment analysis"
        }
      },

      // Platform-specific decay rates
      platformLambdas: status.lambdas,

      // Real-time tracking stats (in-memory)
      clickTracking: {
        totalClicks: status.clickTracking.totalClicks,
        unattributedClicks: status.clickTracking.unattributedClicks,
        uniqueUsers: status.clickTracking.uniqueUsers,
        uniqueIps: status.clickTracking.uniqueIps,
        description: "In-memory click cache for sub-millisecond attribution lookups"
      },

      // Redis cache stats
      redisCache: {
        connected: status.redisCache.connected,
        totalKeys: status.redisCache.totalKeys,
        description: "Redis cache for cross-instance click lookups"
      },

      // User-specific stats
      userStats: {
        pendingClicks: unattributedClicks.length,
        totalAttributions,
        feedbackProvided: feedbackCount,
        userAccuracy: userAccuracy ? (userAccuracy * 100).toFixed(1) + "%" : "No feedback yet",
        averageConfidence: avgConfidence._avg.confidenceScore 
          ? (avgConfidence._avg.confidenceScore * 100).toFixed(1) + "%"
          : "No attributions yet"
      },

      // Confidence score breakdown
      confidenceScoring: {
        signals: [
          { name: "IP Match", weight: 0.50, description: "Same IP address between click and sale" },
          { name: "Tracker ID", weight: 0.35, description: "Persistent cookie matching" },
          { name: "Fingerprint", weight: 0.25, description: "Browser fingerprint correlation" },
          { name: "Geo Match", weight: 0.15, description: "Same country/city" },
          { name: "Time Bonus (<1hr)", weight: 0.10, description: "Click within 1 hour of sale" },
          { name: "Multi-Signal Bonus", weight: 0.10, description: "3+ matching signals" }
        ],
        description: "Multiple signals are combined for higher confidence scores"
      },

      // Cache hierarchy explanation
      cacheHierarchy: {
        tiers: [
          { 
            tier: 1, 
            name: "In-Memory Engine", 
            latency: "~0.1ms", 
            description: "Fastest lookups, single instance, recent clicks" 
          },
          { 
            tier: 2, 
            name: "Redis Cache", 
            latency: "~1-5ms", 
            description: "Fast lookups, shared across instances, 24hr window" 
          },
          { 
            tier: 3, 
            name: "Database", 
            latency: "~10-50ms", 
            description: "Complete historical data, persistent" 
          }
        ]
      }
    });

  } catch (error) {
    console.error("[Model Status] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch model status" },
      { status: 500 }
    );
  }
}
