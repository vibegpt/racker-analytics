/**
 * SINGLE LINK API
 * 
 * GET /api/links/[id] - Get link details with stats
 * PATCH /api/links/[id] - Update link (including geo routing)
 * DELETE /api/links/[id] - Archive link (soft delete)
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { Platform, RouterType } from "@prisma/client";
import { validateGeoConfig, GeoRouterConfig } from "@/lib/routing/geo-router";

// GET - Fetch link details with stats
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
            routedTo: true,
            routeMatch: true,
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

    // Calculate geo routing stats if applicable
    let geoStats = null;
    if (link.routerType === "GEO_AFFILIATE") {
      const clicksByCountry = link.clicks.reduce((acc, click) => {
        const country = click.country || "Unknown";
        acc[country] = (acc[country] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const clicksByRouteMatch = link.clicks.reduce((acc, click) => {
        const match = click.routeMatch || "standard";
        acc[match] = (acc[match] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      geoStats = {
        clicksByCountry,
        clicksByRouteMatch,
      };
    }

    const shortDomain = process.env.NEXT_PUBLIC_SHORT_DOMAIN || "rackr.co";

    return NextResponse.json({
      link,
      stats: {
        totalClicks: link._count.clicks,
        totalAttributions: link._count.attributions,
        totalRevenue,
        conversionRate:
          link._count.clicks > 0
            ? (link._count.attributions / link._count.clicks) * 100
            : 0,
      },
      geoStats,
      shortUrl: `https://${shortDomain}/${link.slug}`,
    });
  } catch (error) {
    console.error("Error fetching link:", error);
    return NextResponse.json(
      { error: "Failed to fetch link" },
      { status: 500 }
    );
  }
}

// PATCH - Update link
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

    const existingLink = await db.smartLink.findFirst({
      where: { id, userId: user.id },
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
      routerType,
      geoRoutes,
    } = body;

    const updateData: any = {};

    if (originalUrl !== undefined) {
      try {
        new URL(originalUrl);
        updateData.originalUrl = originalUrl;
      } catch {
        return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
      }
    }

    if (platform !== undefined) {
      const validPlatforms = ["TWITTER", "YOUTUBE", "INSTAGRAM", "TIKTOK", "TWITCH", "NEWSLETTER", "DISCORD", "OTHER"];
      const normalizedPlatform = platform.toUpperCase();
      if (!validPlatforms.includes(normalizedPlatform)) {
        return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
      }
      updateData.platform = normalizedPlatform as Platform;
    }

    if (metaTitle !== undefined) updateData.metaTitle = metaTitle;
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription;
    if (metaImage !== undefined) updateData.metaImage = metaImage;
    if (campaignName !== undefined) updateData.campaignName = campaignName;
    if (notes !== undefined) updateData.notes = notes;
    if (active !== undefined) updateData.active = active;

    // Handle geo routing updates
    if (routerType !== undefined) {
      if (routerType === "STANDARD") {
        updateData.routerType = "STANDARD";
        updateData.routerConfig = null;
      } else if (routerType === "GEO_AFFILIATE") {
        if (!geoRoutes || geoRoutes.length === 0) {
          return NextResponse.json(
            { error: "geoRoutes required when routerType is GEO_AFFILIATE" },
            { status: 400 }
          );
        }

        const defaultUrl = updateData.originalUrl || existingLink.originalUrl;
        const routerConfig: GeoRouterConfig = {
          defaultUrl,
          routes: geoRoutes.map((r: any) => ({
            country: r.country.toUpperCase(),
            url: r.url,
            label: r.label || undefined,
          })),
        };

        const validation = validateGeoConfig(routerConfig);
        if (!validation.valid) {
          return NextResponse.json(
            { error: "Invalid geo routing config", details: validation.errors },
            { status: 400 }
          );
        }

        updateData.routerType = "GEO_AFFILIATE";
        updateData.routerConfig = routerConfig;
      } else {
        return NextResponse.json(
          { error: "Invalid routerType. Must be STANDARD or GEO_AFFILIATE" },
          { status: 400 }
        );
      }
    } else if (geoRoutes !== undefined && existingLink.routerType === "GEO_AFFILIATE") {
      const defaultUrl = updateData.originalUrl || existingLink.originalUrl;
      const routerConfig: GeoRouterConfig = {
        defaultUrl,
        routes: geoRoutes.map((r: any) => ({
          country: r.country.toUpperCase(),
          url: r.url,
          label: r.label || undefined,
        })),
      };

      const validation = validateGeoConfig(routerConfig);
      if (!validation.valid) {
        return NextResponse.json(
          { error: "Invalid geo routing config", details: validation.errors },
          { status: 400 }
        );
      }
      updateData.routerConfig = routerConfig;
    }

    const link = await db.smartLink.update({
      where: { id },
      data: updateData,
    });

    const shortDomain = process.env.NEXT_PUBLIC_SHORT_DOMAIN || "rackr.co";

    return NextResponse.json({
      link,
      shortUrl: `https://${shortDomain}/${link.slug}`,
      isGeoRouted: link.routerType === "GEO_AFFILIATE",
    });
  } catch (error) {
    console.error("Error updating link:", error);
    return NextResponse.json({ error: "Failed to update link" }, { status: 500 });
  }
}

// DELETE - Archive link
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

    const existingLink = await db.smartLink.findFirst({
      where: { id, userId: user.id },
    });

    if (!existingLink) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    await db.smartLink.update({
      where: { id },
      data: { archived: true, active: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting link:", error);
    return NextResponse.json({ error: "Failed to delete link" }, { status: 500 });
  }
}
