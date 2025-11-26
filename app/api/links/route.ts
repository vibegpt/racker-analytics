/**
 * SMART LINKS API
 * 
 * GET /api/links - Get all links for the current user
 * POST /api/links - Create a new smart link
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { Platform } from "@prisma/client";
import { generateSlug, isSlugAvailable } from "@/lib/links/slug-generator";

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's internal ID
    const user = await db.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get("platform");
    const active = searchParams.get("active");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build query filters
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

    // Fetch links with stats
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
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's internal ID
    const user = await db.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
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

    // Generate or validate slug
    let slug: string;
    
    if (customSlug) {
      // Validate custom slug format
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

      // Check if custom slug is available
      const available = await isSlugAvailable(customSlug);
      if (!available) {
        return NextResponse.json(
          { error: "This slug is already taken" },
          { status: 409 }
        );
      }
      
      slug = customSlug.toLowerCase();
    } else {
      // Generate unique slug
      slug = await generateSlug();
    }

    // Create the link
    const link = await db.smartLink.create({
      data: {
        userId: user.id,
        slug,
        originalUrl,
        platform: normalizedPlatform as Platform,
        metaTitle,
        metaDescription,
        metaImage,
        campaignName,
        notes,
      },
    });

    return NextResponse.json({
      link,
      shortUrl: `${process.env.NEXT_PUBLIC_SHORT_DOMAIN || 'rckr.co'}/${slug}`,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating link:", error);
    return NextResponse.json(
      { error: "Failed to create link" },
      { status: 500 }
    );
  }
}
