/**
 * ATTRIBUTION STATS API
 * 
 * GET /api/analytics/attribution - Get attribution statistics and recent attributions
 * 
 * Query params:
 * - days: number (default 30) - Time range
 * - status: 'all' | 'matched' | 'confirmed' | 'rejected' | 'uncertain'
 * - limit: number (default 20) - Number of recent attributions to return
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { getExtendedModelStatus, getUnattributedClicksForUser } from "@/lib/attribution/attribution-service";

export async function GET(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");
    const status = searchParams.get("status") || "all";
    const limit = parseInt(searchParams.get("limit") || "20");

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build status filter
    const statusFilter = status !== "all" ? { status: status.toUpperCase() } : {};

    // Get user's Clerk ID to find their internal user
    const user = await db.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch attribution statistics
    const [
      totalAttributions,
      matchedCount,
      confirmedCount,
      rejectedCount,
      uncertainCount,
      recentAttributions,
      totalRevenue,
      attributedRevenue,
      topLinks
    ] = await Promise.all([
      // Total attributions
      db.attribution.count({
        where: {
          userId: user.id,
          createdAt: { gte: startDate }
        }
      }),

      // Matched (auto-attributed)
      db.attribution.count({
        where: {
          userId: user.id,
          status: "MATCHED",
          createdAt: { gte: startDate }
        }
      }),

      // User confirmed
      db.attribution.count({
        where: {
          userId: user.id,
          status: "CONFIRMED",
          createdAt: { gte: startDate }
        }
      }),

      // User rejected
      db.attribution.count({
        where: {
          userId: user.id,
          status: "REJECTED",
          createdAt: { gte: startDate }
        }
      }),

      // Uncertain (needs review)
      db.attribution.count({
        where: {
          userId: user.id,
          status: "UNCERTAIN",
          createdAt: { gte: startDate }
        }
      }),

      // Recent attributions with details
      db.attribution.findMany({
        where: {
          userId: user.id,
          createdAt: { gte: startDate },
          ...statusFilter
        },
        include: {
          click: {
            include: { link: true }
          },
          sale: true,
          link: true
        },
        orderBy: { createdAt: "desc" },
        take: limit
      }),

      // Total sales revenue in period
      db.sale.aggregate({
        where: {
          userId: user.id,
          createdAt: { gte: startDate },
          status: "succeeded"
        },
        _sum: { amount: true },
        _count: true
      }),

      // Attributed revenue (sales with attributions)
      db.attribution.findMany({
        where: {
          userId: user.id,
          createdAt: { gte: startDate },
          status: { in: ["MATCHED", "CONFIRMED"] }
        },
        include: {
          sale: { select: { amount: true } }
        }
      }).then((attrs: any[]) => attrs.reduce((sum, a) => sum + (a.sale?.amount || 0), 0)),

      // Top performing links by attributed revenue
      db.attribution.groupBy({
        by: ["linkId"],
        where: {
          userId: user.id,
          createdAt: { gte: startDate },
          status: { in: ["MATCHED", "CONFIRMED"] }
        },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5
      })
    ]);

    // Fetch link details for top links
    const topLinksWithDetails = await Promise.all(
      topLinks.map(async (item) => {
        const link = await db.smartLink.findUnique({
          where: { id: item.linkId },
          select: { id: true, slug: true, platform: true, originalUrl: true }
        });
        return {
          link,
          attributionCount: item._count.id
        };
      })
    );

    // Get model status (includes real-time click tracking)
    const modelStatus = await getExtendedModelStatus();

    // Get unattributed clicks for this user
    const unattributedClicks = getUnattributedClicksForUser(user.id);

    // Calculate metrics
    const totalSalesCount = totalRevenue._count || 0;
    const totalSalesAmount = totalRevenue._sum.amount || 0;
    const attributionRate = totalSalesCount > 0 
      ? ((matchedCount + confirmedCount) / totalSalesCount * 100).toFixed(1)
      : "0";
    const attributedRevenuePercent = totalSalesAmount > 0
      ? (attributedRevenue / totalSalesAmount * 100).toFixed(1)
      : "0";

    // Average confidence score
    const avgConfidence = recentAttributions.length > 0
      ? recentAttributions.reduce((sum, a) => sum + a.confidenceScore, 0) / recentAttributions.length
      : 0;

    return NextResponse.json({
      // Summary stats
      summary: {
        totalAttributions,
        byStatus: {
          matched: matchedCount,
          confirmed: confirmedCount,
          rejected: rejectedCount,
          uncertain: uncertainCount
        },
        attributionRate: parseFloat(attributionRate),
        averageConfidence: avgConfidence,
        period: {
          days,
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString()
        }
      },

      // Revenue metrics
      revenue: {
        totalSales: totalSalesCount,
        totalAmount: totalSalesAmount / 100, // Convert cents to dollars
        attributedAmount: attributedRevenue / 100,
        attributedPercent: parseFloat(attributedRevenuePercent),
        currency: "USD"
      },

      // Top performing links
      topLinks: topLinksWithDetails.filter(t => t.link),

      // Recent attributions
      recentAttributions: recentAttributions.map((attr: any) => ({
        id: attr.id,
        status: attr.status,
        confidence: attr.confidenceScore,
        timeDelta: attr.timeDeltaMinutes,
        createdAt: attr.createdAt,
        matchedBy: attr.matchedBy,
        click: attr.click ? {
          id: attr.click.id,
          clickedAt: attr.click.clickedAt,
          platform: attr.click.link?.platform,
          country: attr.click.country,
          city: attr.click.city
        } : null,
        sale: attr.sale ? {
          id: attr.sale.id,
          amount: attr.sale.amount / 100,
          currency: attr.sale.currency,
          productName: attr.sale.productName,
          createdAt: attr.sale.createdAt
        } : null,
        link: attr.link ? {
          id: attr.link.id,
          slug: attr.link.slug,
          platform: attr.link.platform
        } : null
      })),

      // Model/engine status
      model: {
        version: modelStatus.version,
        accuracy: modelStatus.accuracy,
        isLearning: modelStatus.isLearning,
        trainingDataCount: modelStatus.trainingDataCount,
        weights: modelStatus.weights,
        clickTracking: modelStatus.clickTracking,
        redisCache: modelStatus.redisCache
      },

      // Pending clicks (not yet converted)
      pendingClicks: {
        count: unattributedClicks.length,
        clicks: unattributedClicks.slice(0, 10).map(c => ({
          id: c.id,
          slug: c.slug,
          platform: c.platform,
          clickedAt: c.clickedAt,
          country: c.country,
          city: c.city
        }))
      }
    });

  } catch (error) {
    console.error("[Attribution Stats] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch attribution stats" },
      { status: 500 }
    );
  }
}
