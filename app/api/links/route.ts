/**
 * SMART LINKS API
 *
 * GET /api/links - Get all links for the current user
 * POST /api/links - Create a new smart link (with optional geo routing)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { Platform, RouterType } from "@prisma/client";
import { generateSlug, isSlugAvailable } from "@/lib/links/slug-generator";
import { validateGeoConfig, GeoRouterConfig } from "@/lib/routing/geo-router";

// Dev mode: get or create a test user
async function getDevUser() {
  const DEV_CLERK_ID = "dev_test_user";
  let user = await db.user.findUnique({ where: { clerkId: DEV_CLERK_ID } });
  if (!user) {
    user = await db.user.create({
      data: {
        clerkId: DEV_CLERK_ID,
        email: "dev@test.local",
        name: "Dev User",
      },
    });
  }
  return user;
}

export async function GET(request: NextRequest) {
  try {
    // Dev mode bypass
    const isDev = process.env.NODE_ENV === "development";
    let user;

    if (isDev) {
      user = await getDevUser();
    } else {
      const { userId: clerkId } = await auth();
      if (!clerkId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      user = await db.user.findUnique({ where: { clerkId } });
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
    }

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get("platform");
    const active = searchParams.get("active");
    const routerType = searchParams.get("routerType");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: any = {
      userId: user.id,
      archived: false,
    };

    if (platform) {
      where.platform = platform.toUpperCase() as Platform;
    }

    if (active !== null) {
      where.active = active === "true";
    }

    if (routerType) {
      where.routerType = routerType.toUpperCase() as RouterType;
    }

    const [links, total] = await Promise.all([
      db.smartLink.findMany({
        where,
        include: {
          _count: {
            select: {
              clicks: true,
              attributions: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      db.smartLink.count({ where }),
    ]);

    return NextResponse.json({
      links,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + links.length < total,
      },
    });
  } catch (error) {
    console.error("Error fetching links:", error);
    return NextResponse.json(
      { error: "Failed to fetch links" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Dev mode bypass
    const isDev = process.env.NODE_ENV === "development";
    let user;

    if (isDev) {
      user = await getDevUser();
    } else {
      const { userId: clerkId } = await auth();
      if (!clerkId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      user = await db.user.findUnique({ where: { clerkId } });
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
    }

    const body = await request.json();
    const {
      originalUrl,
      platform,
      customSlug,
      metaTitle,
      metaDescription,
      metaImage,
      campaignName,
      notes,
      // New: Geo routing fields
      routerType,
      geoRoutes,
    } = body;

    // Validate required fields
    if (!originalUrl) {
      return NextResponse.json(
        { error: "Original URL is required" },
        { status: 400 }
      );
    }

    if (!platform) {
      return NextResponse.json(
        { error: "Platform is required" },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(originalUrl);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Validate platform
    const validPlatforms = ["TWITTER", "YOUTUBE", "INSTAGRAM", "TIKTOK", "TWITCH", "NEWSLETTER", "DISCORD", "OTHER"];
    const normalizedPlatform = platform.toUpperCase();
    if (!validPlatforms.includes(normalizedPlatform)) {
      return NextResponse.json(
        { error: "Invalid platform" },
        { status: 400 }
      );
    }

    // Build router config if geo routing is enabled
    let routerConfig: GeoRouterConfig | null = null;
    let finalRouterType: RouterType = "STANDARD";

    if (routerType === "GEO_AFFILIATE" && geoRoutes && geoRoutes.length > 0) {
      routerConfig = {
        defaultUrl: originalUrl,
        routes: geoRoutes.map((r: any) => ({
          country: r.country.toUpperCase(),
          url: r.url,
          label: r.label || undefined,
        })),
      };

      // Validate the config
      const validation = validateGeoConfig(routerConfig);
      if (!validation.valid) {
        return NextResponse.json(
          { error: "Invalid geo routing config", details: validation.errors },
          { status: 400 }
        );
      }

      finalRouterType = "GEO_AFFILIATE";
    }

    // Generate or validate slug
    let slug: string;
    
    if (customSlug) {
      if (!/^[a-zA-Z0-9-_]+$/.test(customSlug)) {
        return NextResponse.json(
          { error: "Slug can only contain letters, numbers, hyphens, and underscores" },
          { status: 400 }
        );
      }
      
      if (customSlug.length < 3 || customSlug.length > 50) {
        return NextResponse.json(
          { error: "Slug must be between 3 and 50 characters" },
          { status: 400 }
        );
      }

      const available = await isSlugAvailable(customSlug);
      if (!available) {
        return NextResponse.json(
          { error: "This slug is already taken" },
          { status: 409 }
        );
      }
      
      slug = customSlug.toLowerCase();
    } else {
      slug = await generateSlug();
    }

    // Create the link
    const link = await db.smartLink.create({
      data: {
        userId: user.id,
        slug,
        originalUrl,
        platform: normalizedPlatform as Platform,
        routerType: finalRouterType,
        routerConfig: routerConfig as any,
        metaTitle,
        metaDescription,
        metaImage,
        campaignName,
        notes,
      },
    });

    const shortDomain = process.env.NEXT_PUBLIC_SHORT_DOMAIN || 'rackr.co';

    return NextResponse.json({
      link,
      shortUrl: `https://${shortDomain}/${slug}`,
      isGeoRouted: finalRouterType === "GEO_AFFILIATE",
      routeCount: routerConfig?.routes?.length || 0,
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating link:", error);
    return NextResponse.json(
      { error: "Failed to create link" },
      { status: 500 }
    );
  }
}
