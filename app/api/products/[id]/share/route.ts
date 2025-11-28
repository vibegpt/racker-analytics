/**
 * ONE-CLICK SHARE LINK GENERATION
 *
 * POST /api/products/[id]/share
 * Body: { platform: "TWITTER" | "INSTAGRAM" | "TIKTOK" | ... }
 *
 * Generates a new unique short link for the product+platform combination.
 * Each click creates a new link: fire-tw-001, fire-tw-002, etc.
 * This enables per-post attribution tracking.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { Platform, SubscriptionTier } from "@prisma/client";
import { canCreateLink, getTierConfig, getRemainingLinks } from "@/lib/tiers";

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

// Platform short codes for URL generation
const PLATFORM_CODES: Record<Platform, string> = {
  TWITTER: "tw",
  YOUTUBE: "yt",
  INSTAGRAM: "ig",
  TIKTOK: "tt",
  TWITCH: "tv",
  NEWSLETTER: "nl",
  DISCORD: "dc",
  OTHER: "ot",
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;

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

    // Get the product
    const product = await db.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (product.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (!product.active) {
      return NextResponse.json(
        { error: "Product is not active" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { platform, type = "post" } = body; // type: "post" | "bio"

    if (!platform) {
      return NextResponse.json(
        { error: "platform is required" },
        { status: 400 }
      );
    }

    const normalizedPlatform = platform.toUpperCase() as Platform;
    const validPlatforms = Object.keys(PLATFORM_CODES);

    if (!validPlatforms.includes(normalizedPlatform)) {
      return NextResponse.json(
        { error: "Invalid platform" },
        { status: 400 }
      );
    }

    const platformCode = PLATFORM_CODES[normalizedPlatform];
    const shortDomain = process.env.NEXT_PUBLIC_SHORT_DOMAIN || "rackr.co";

    // Get user's subscription tier
    const subscription = await db.subscription.findUnique({
      where: { userId: user.id },
    });
    const tier: SubscriptionTier = subscription?.tier || "HUSTLER";

    // BIO LINKS: Get or create a permanent link for this platform
    // Bio links don't count against monthly limit
    if (type === "bio") {
      const bioSlug = `${product.shortCode}-${platformCode}-bio`;

      // Check if bio link already exists
      const existingBioLink = await db.smartLink.findUnique({
        where: { slug: bioSlug },
      });

      if (existingBioLink) {
        // Return existing bio link
        return NextResponse.json({
          link: existingBioLink,
          shortUrl: `https://${shortDomain}/${bioSlug}`,
          linkNumber: 0,
          platform: normalizedPlatform,
          type: "bio",
          isNew: false,
        });
      }

      // Create new bio link
      const bioLink = await db.smartLink.create({
        data: {
          userId: user.id,
          productId: product.id,
          linkNumber: 0, // 0 = bio link
          slug: bioSlug,
          originalUrl: product.destinationUrl,
          platform: normalizedPlatform,
          routerType: product.routerType,
          routerConfig: product.routerConfig,
        },
      });

      return NextResponse.json(
        {
          link: bioLink,
          shortUrl: `https://${shortDomain}/${bioSlug}`,
          linkNumber: 0,
          platform: normalizedPlatform,
          type: "bio",
          isNew: true,
        },
        { status: 201 }
      );
    }

    // POST LINKS: Generate a new sequential link
    // Check monthly link limit for post links
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const linksThisMonth = await db.smartLink.count({
      where: {
        userId: user.id,
        linkNumber: { gt: 0 }, // Only count post links, not bio links
        createdAt: { gte: startOfMonth },
      },
    });

    if (!canCreateLink(tier, linksThisMonth)) {
      const tierConfig = getTierConfig(tier);
      const remaining = getRemainingLinks(tier, linksThisMonth);
      return NextResponse.json(
        {
          error: "Monthly link limit reached",
          message: `Your ${tierConfig.displayName} plan allows ${tierConfig.limits.maxLinksPerMonth} links/month. Upgrade to create more.`,
          currentCount: linksThisMonth,
          limit: tierConfig.limits.maxLinksPerMonth,
          remaining,
          upgradeRequired: true,
        },
        { status: 403 }
      );
    }

    // Get the next link number for this product+platform combo (excluding bio links)
    const existingLinks = await db.smartLink.count({
      where: {
        productId: product.id,
        platform: normalizedPlatform,
        linkNumber: { gt: 0 }, // Exclude bio links (linkNumber = 0)
      },
    });

    const linkNumber = existingLinks + 1;

    // Generate slug: {shortCode}-{platformCode}-{number}
    // e.g., fire-tw-001, fire-tw-002, fire-ig-001
    const paddedNumber = String(linkNumber).padStart(3, "0");
    const slug = `${product.shortCode}-${platformCode}-${paddedNumber}`;

    // Check if slug already exists (edge case)
    const existingSlug = await db.smartLink.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      // Add random suffix if collision
      const randomSuffix = Math.random().toString(36).substring(2, 5);
      const newSlug = `${slug}-${randomSuffix}`;

      const link = await db.smartLink.create({
        data: {
          userId: user.id,
          productId: product.id,
          linkNumber,
          slug: newSlug,
          originalUrl: product.destinationUrl,
          platform: normalizedPlatform,
          routerType: product.routerType,
          routerConfig: product.routerConfig,
        },
      });

      return NextResponse.json(
        {
          link,
          shortUrl: `https://${shortDomain}/${newSlug}`,
          linkNumber,
          platform: normalizedPlatform,
        },
        { status: 201 }
      );
    }

    // Create the new share link
    const link = await db.smartLink.create({
      data: {
        userId: user.id,
        productId: product.id,
        linkNumber,
        slug,
        originalUrl: product.destinationUrl,
        platform: normalizedPlatform,
        routerType: product.routerType,
        routerConfig: product.routerConfig,
      },
    });

    return NextResponse.json(
      {
        link,
        shortUrl: `https://${shortDomain}/${slug}`,
        linkNumber,
        platform: normalizedPlatform,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error generating share link:", error);
    return NextResponse.json(
      { error: "Failed to generate share link" },
      { status: 500 }
    );
  }
}

// GET - List all share links for this product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;

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

    const product = await db.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (product.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get("platform");

    const where: any = {
      productId: product.id,
    };

    if (platform) {
      where.platform = platform.toUpperCase() as Platform;
    }

    const links = await db.smartLink.findMany({
      where,
      include: {
        _count: {
          select: { clicks: true, attributions: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const shortDomain = process.env.NEXT_PUBLIC_SHORT_DOMAIN || "rackr.co";

    const linksWithUrls = links.map((link) => ({
      ...link,
      shortUrl: `https://${shortDomain}/${link.slug}`,
    }));

    return NextResponse.json({
      product: {
        id: product.id,
        name: product.name,
        shortCode: product.shortCode,
        destinationUrl: product.destinationUrl,
      },
      links: linksWithUrls,
      totalLinks: links.length,
    });
  } catch (error) {
    console.error("Error fetching share links:", error);
    return NextResponse.json(
      { error: "Failed to fetch share links" },
      { status: 500 }
    );
  }
}
