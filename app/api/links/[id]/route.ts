/**
 * SINGLE LINK API
 * 
 * GET /api/links/[id] - Get link details with stats
 * PATCH /api/links/[id] - Update link
 * DELETE /api/links/[id] - Archive link (soft delete)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { Platform } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    const { id } = await params;

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const link = await db.smartLink.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        _count: {
          select: {
            clicks: true,
            attributions: true,
          },
        },
        clicks: {
          take: 100,
          orderBy: { clickedAt: "desc" },
          select: {
            id: true,
            clickedAt: true,
            country: true,
            city: true,
            deviceType: true,
            browser: true,
          },
        },
        attributions: {
          include: {
            sale: {
              select: {
                amount: true,
                currency: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    // Calculate stats
    const totalRevenue = link.attributions.reduce(
      (sum, attr) => sum + (attr.sale?.amount || 0) * attr.revenueShare,
      0
    );

    return NextResponse.json({
      link,
      stats: {
        totalClicks: link._count.clicks,
        totalAttributions: link._count.attributions,
        totalRevenue,
        conversionRate: link._count.clicks > 0 
          ? (link._count.attributions / link._count.clicks) * 100 
          : 0,
      },
      shortUrl: `${process.env.NEXT_PUBLIC_SHORT_DOMAIN || 'rckr.co'}/${link.slug}`,
    });
  } catch (error) {
    console.error("Error fetching link:", error);
    return NextResponse.json(
      { error: "Failed to fetch link" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    const { id } = await params;

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify ownership
    const existingLink = await db.smartLink.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingLink) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      originalUrl,
      platform,
      metaTitle,
      metaDescription,
      metaImage,
      campaignName,
      notes,
      active,
    } = body;

    // Build update data
    const updateData: any = {};

    if (originalUrl !== undefined) {
      try {
        new URL(originalUrl);
        updateData.originalUrl = originalUrl;
      } catch {
        return NextResponse.json(
          { error: "Invalid URL format" },
          { status: 400 }
        );
      }
    }

    if (platform !== undefined) {
      const validPlatforms = ["TWITTER", "YOUTUBE", "INSTAGRAM", "TIKTOK", "TWITCH", "NEWSLETTER", "DISCORD", "OTHER"];
      const normalizedPlatform = platform.toUpperCase();
      if (!validPlatforms.includes(normalizedPlatform)) {
        return NextResponse.json(
          { error: "Invalid platform" },
          { status: 400 }
        );
      }
      updateData.platform = normalizedPlatform as Platform;
    }

    if (metaTitle !== undefined) updateData.metaTitle = metaTitle;
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription;
    if (metaImage !== undefined) updateData.metaImage = metaImage;
    if (campaignName !== undefined) updateData.campaignName = campaignName;
    if (notes !== undefined) updateData.notes = notes;
    if (active !== undefined) updateData.active = active;

    const link = await db.smartLink.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ link });
  } catch (error) {
    console.error("Error updating link:", error);
    return NextResponse.json(
      { error: "Failed to update link" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    const { id } = await params;

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify ownership
    const existingLink = await db.smartLink.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingLink) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    // Soft delete (archive)
    await db.smartLink.update({
      where: { id },
      data: {
        archived: true,
        active: false,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting link:", error);
    return NextResponse.json(
      { error: "Failed to delete link" },
      { status: 500 }
    );
  }
}
