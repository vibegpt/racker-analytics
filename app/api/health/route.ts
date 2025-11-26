/**
 * HEALTH CHECK API
 * 
 * GET /api/health - Check system health
 * GET /api/health?detailed=true - Detailed health check (requires auth)
 * 
 * Checks:
 * - Database connection
 * - Redis connection
 * - Attribution engine status
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { getCacheStats } from "@/lib/cache/click-cache";
import { getAdaptiveEngine } from "@/lib/attribution/attribution-service";

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const { searchParams } = new URL(request.url);
  const detailed = searchParams.get("detailed") === "true";

  // Basic health check (no auth required)
  const health: any = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0"
  };

  // Check database
  try {
    await db.$queryRaw`SELECT 1`;
    health.database = { status: "connected" };
  } catch (error) {
    health.database = { status: "error", error: "Connection failed" };
    health.status = "degraded";
  }

  // Check Redis
  try {
    const cacheStats = await getCacheStats();
    health.redis = {
      status: cacheStats.connected ? "connected" : "disconnected",
      keys: cacheStats.totalKeys
    };
    if (!cacheStats.connected) {
      health.status = "degraded";
    }
  } catch (error) {
    health.redis = { status: "error" };
    health.status = "degraded";
  }

  // Detailed checks require authentication
  if (detailed) {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required for detailed health check" },
        { status: 401 }
      );
    }

    // Attribution engine status
    try {
      const engine = getAdaptiveEngine();
      const state = engine.getModelState();
      const clickStats = engine.getClickStats();
      
      health.attributionEngine = {
        status: "running",
        version: state.weights.version,
        isLearning: state.isLearning,
        trainingDataCount: state.trainingDataCount,
        clicksInMemory: clickStats.totalClicks,
        uniqueUsers: clickStats.uniqueUsers
      };
    } catch (error) {
      health.attributionEngine = { status: "error" };
      health.status = "degraded";
    }

    // Database counts
    try {
      const [users, links, clicks, sales, attributions] = await Promise.all([
        db.user.count(),
        db.smartLink.count(),
        db.click.count(),
        db.sale.count(),
        db.attribution.count()
      ]);
      
      health.counts = {
        users,
        smartLinks: links,
        clicks,
        sales,
        attributions
      };
    } catch (error) {
      health.counts = { error: "Failed to fetch counts" };
    }

    // Recent activity (last 24 hours)
    try {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      const [recentClicks, recentSales, recentAttributions] = await Promise.all([
        db.click.count({ where: { clickedAt: { gte: oneDayAgo } } }),
        db.sale.count({ where: { createdAt: { gte: oneDayAgo } } }),
        db.attribution.count({ where: { createdAt: { gte: oneDayAgo } } })
      ]);
      
      health.recentActivity = {
        last24Hours: {
          clicks: recentClicks,
          sales: recentSales,
          attributions: recentAttributions
        }
      };
    } catch (error) {
      health.recentActivity = { error: "Failed to fetch activity" };
    }
  }

  health.responseTime = `${Date.now() - startTime}ms`;

  const statusCode = health.status === "healthy" ? 200 : 503;
  return NextResponse.json(health, { status: statusCode });
}
