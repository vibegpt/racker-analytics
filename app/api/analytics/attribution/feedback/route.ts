/**
 * ATTRIBUTION FEEDBACK API
 * 
 * POST /api/analytics/attribution/feedback - Confirm or reject an attribution
 * 
 * Body:
 * - attributionId: string
 * - action: 'confirm' | 'reject'
 * 
 * This feeds back into the adaptive learning model to improve future predictions.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { processAttributionFeedback } from "@/lib/attribution/attribution-service";

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { attributionId, action } = body;

    if (!attributionId) {
      return NextResponse.json(
        { error: "attributionId is required" },
        { status: 400 }
      );
    }

    if (!action || !["confirm", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "action must be 'confirm' or 'reject'" },
        { status: 400 }
      );
    }

    // Get user's internal ID
    const user = await db.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify the attribution belongs to this user
    const attribution = await db.attribution.findFirst({
      where: {
        id: attributionId,
        userId: user.id
      },
      include: {
        click: { include: { link: true } },
        sale: true
      }
    });

    if (!attribution) {
      return NextResponse.json(
        { error: "Attribution not found" },
        { status: 404 }
      );
    }

    // Process feedback (updates model weights)
    const userConfirmed = action === "confirm";
    await processAttributionFeedback(attributionId, userConfirmed);

    // Get updated attribution
    const updated = await db.attribution.findUnique({
      where: { id: attributionId },
      include: {
        click: { include: { link: true } },
        sale: true
      }
    });

    console.log(`[Attribution Feedback] ${action} for ${attributionId} by user ${user.id}`);

    return NextResponse.json({
      success: true,
      action,
      attribution: {
        id: updated?.id,
        status: updated?.status,
        confidence: updated?.confidenceScore,
        updatedAt: updated?.updatedAt
      },
      message: userConfirmed 
        ? "Attribution confirmed - model updated" 
        : "Attribution rejected - model updated"
    });

  } catch (error) {
    console.error("[Attribution Feedback] Error:", error);
    return NextResponse.json(
      { error: "Failed to process feedback" },
      { status: 500 }
    );
  }
}

/**
 * GET - Get attributions needing review
 */
export async function GET(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");

    // Get user's internal ID
    const user = await db.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get attributions that need review (UNCERTAIN or low confidence MATCHED)
    const needsReview = await db.attribution.findMany({
      where: {
        userId: user.id,
        OR: [
          { status: "UNCERTAIN" },
          { 
            status: "MATCHED",
            confidenceScore: { lt: 0.75 }
          }
        ]
      },
      include: {
        click: { include: { link: true } },
        sale: true,
        link: true
      },
      orderBy: { createdAt: "desc" },
      take: limit
    });

    return NextResponse.json({
      count: needsReview.length,
      attributions: needsReview.map((attr: any) => ({
        id: attr.id,
        status: attr.status,
        confidence: attr.confidenceScore,
        timeDelta: attr.timeDeltaMinutes,
        createdAt: attr.createdAt,
        matchedBy: attr.matchedBy,
        click: attr.click ? {
          id: attr.click.id,
          clickedAt: attr.click.clickedAt,
          ipAddress: attr.click.ipAddress ? `${attr.click.ipAddress.split('.').slice(0, 2).join('.')}.*.*` : null, // Partial IP for privacy
          platform: attr.click.link?.platform,
          slug: attr.click.link?.slug,
          country: attr.click.country,
          city: attr.click.city,
          referer: attr.click.referer
        } : null,
        sale: attr.sale ? {
          id: attr.sale.id,
          amount: attr.sale.amount / 100,
          currency: attr.sale.currency,
          productName: attr.sale.productName,
          customerEmail: attr.sale.customerEmail ? `${attr.sale.customerEmail.split('@')[0].slice(0, 3)}***@${attr.sale.customerEmail.split('@')[1]}` : null, // Partial email for privacy
          country: attr.sale.country,
          city: attr.sale.city,
          createdAt: attr.sale.createdAt
        } : null,
        link: attr.link ? {
          id: attr.link.id,
          slug: attr.link.slug,
          platform: attr.link.platform,
          originalUrl: attr.link.originalUrl
        } : null
      }))
    });

  } catch (error) {
    console.error("[Attribution Feedback] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch attributions for review" },
      { status: 500 }
    );
  }
}
