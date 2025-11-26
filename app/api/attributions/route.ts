/**
 * ATTRIBUTIONS LIST API
 * 
 * GET /api/attributions - List attributions for the authenticated user
 * 
 * Query params:
 * - status: 'all' | 'MATCHED' | 'CONFIRMED' | 'REJECTED' | 'UNCERTAIN' | 'PENDING'
 * - linkId: Filter by smart link
 * - days: Number of days to look back (default 30)
 * - limit: Max results (default 50)
 * - offset: Pagination offset (default 0)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";
    const linkId = searchParams.get("linkId");
    const days = parseInt(searchParams.get("days") || "30");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get user's internal ID
    const user = await db.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build where clause
    const where: any = {
      userId: user.id,
      createdAt: { gte: startDate }
    };

    if (status !== "all") {
      where.status = status.toUpperCase();
    }

    if (linkId) {
      where.linkId = linkId;
    }

    // Fetch attributions with related data
    const [attributions, total] = await Promise.all([
      db.attribution.findMany({
        where,
        include: {
          click: {
            include: { link: true }
          },
          sale: true,
          link: true
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset
      }),
      db.attribution.count({ where })
    ]);

    return NextResponse.json({
      attributions: attributions.map((attr: any) => ({
        id: attr.id,
        status: attr.status,
        confidence: attr.confidenceScore,
        timeDeltaMinutes: attr.timeDeltaMinutes,
        revenueShare: attr.revenueShare,
        matchedBy: attr.matchedBy,
        createdAt: attr.createdAt,
        
        click: attr.click ? {
          id: attr.click.id,
          clickedAt: attr.click.clickedAt,
          platform: attr.click.link?.platform,
          slug: attr.click.link?.slug,
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
      
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + attributions.length < total
      },
      
      filters: {
        status,
        linkId,
        days,
        startDate: startDate.toISOString()
      }
    });

  } catch (error) {
    console.error("[Attributions] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch attributions" },
      { status: 500 }
    );
  }
}
