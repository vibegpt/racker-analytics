/**
 * SINGLE ATTRIBUTION API
 * 
 * GET /api/attributions/[id] - Get attribution details
 * PATCH /api/attributions/[id] - Update attribution (manual adjustment)
 * POST /api/attributions/[id] - Confirm or reject attribution (feedback)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { processAttributionFeedback } from "@/lib/attribution/attribution-service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  const { id } = await params;

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

    const attribution = await db.attribution.findFirst({
      where: {
        id,
        userId: user.id
      },
      include: {
        click: {
          include: {
            link: true
          }
        },
        sale: true,
        link: true
      }
    });

    if (!attribution) {
      return NextResponse.json(
        { error: "Attribution not found" },
        { status: 404 }
      );
    }

    // Format response with relevant details
    return NextResponse.json({
      id: attribution.id,
      status: attribution.status,
      confidence: attribution.confidenceScore,
      timeDeltaMinutes: attribution.timeDeltaMinutes,
      revenueShare: attribution.revenueShare,
      matchedBy: attribution.matchedBy,
      createdAt: attribution.createdAt,
      updatedAt: attribution.updatedAt,
      
      click: attribution.click ? {
        id: attribution.click.id,
        clickedAt: attribution.click.clickedAt,
        ipAddress: attribution.click.ipAddress,
        country: attribution.click.country,
        region: attribution.click.region,
        city: attribution.click.city,
        deviceType: attribution.click.deviceType,
        browser: attribution.click.browser,
        os: attribution.click.os,
        referer: attribution.click.referer,
        utmSource: attribution.click.utmSource,
        utmCampaign: attribution.click.utmCampaign,
        link: attribution.click.link ? {
          id: attribution.click.link.id,
          slug: attribution.click.link.slug,
          platform: attribution.click.link.platform,
          originalUrl: attribution.click.link.originalUrl
        } : null
      } : null,
      
      sale: attribution.sale ? {
        id: attribution.sale.id,
        amount: attribution.sale.amount / 100,
        currency: attribution.sale.currency,
        status: attribution.sale.status,
        customerEmail: attribution.sale.customerEmail,
        customerName: attribution.sale.customerName,
        country: attribution.sale.country,
        city: attribution.sale.city,
        productName: attribution.sale.productName,
        createdAt: attribution.sale.createdAt
      } : null,
      
      link: attribution.link ? {
        id: attribution.link.id,
        slug: attribution.link.slug,
        platform: attribution.link.platform,
        originalUrl: attribution.link.originalUrl,
        campaignName: attribution.link.campaignName
      } : null
    });

  } catch (error) {
    console.error('[Attribution] GET Error:', error);
    return NextResponse.json(
      { error: "Failed to fetch attribution" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  const { id } = await params;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { revenueShare, notes } = body;

    // Get user's internal ID
    const user = await db.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify the attribution belongs to this user
    const existing = await db.attribution.findFirst({
      where: {
        id,
        userId: user.id
      }
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Attribution not found" },
        { status: 404 }
      );
    }

    // Update the attribution
    const updated = await db.attribution.update({
      where: { id },
      data: {
        ...(revenueShare !== undefined && { revenueShare }),
        ...(notes !== undefined && { 
          matchedBy: {
            ...(existing.matchedBy as object),
            userNotes: notes
          }
        })
      },
      include: {
        click: { include: { link: true } },
        sale: true
      }
    });

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
      revenueShare: updated.revenueShare,
      matchedBy: updated.matchedBy,
      updatedAt: updated.updatedAt
    });

  } catch (error) {
    console.error('[Attribution] PATCH Error:', error);
    return NextResponse.json(
      { error: "Failed to update attribution" },
      { status: 500 }
    );
  }
}

/**
 * POST - Confirm or reject attribution (provides feedback to model)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  const { id } = await params;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action } = body;

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
    const existing = await db.attribution.findFirst({
      where: {
        id,
        userId: user.id
      }
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Attribution not found" },
        { status: 404 }
      );
    }

    // Process feedback (updates model weights)
    const userConfirmed = action === "confirm";
    await processAttributionFeedback(id, userConfirmed);

    // Get updated attribution
    const updated = await db.attribution.findUnique({
      where: { id }
    });

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
    console.error('[Attribution] POST Error:', error);
    return NextResponse.json(
      { error: "Failed to process feedback" },
      { status: 500 }
    );
  }
}
