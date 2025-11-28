/**
 * PRODUCTS API
 *
 * Products are destination URLs that group multiple share links together.
 * Each time a user shares to a platform, a new unique link is generated
 * under the product for per-post tracking.
 *
 * GET /api/products - List all products for the user
 * POST /api/products - Create a new product
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { RouterType, SubscriptionTier } from "@prisma/client";
import { canCreateProduct, getTierConfig, getRemainingProducts } from "@/lib/tiers";

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
    const active = searchParams.get("active");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: any = {
      userId: user.id,
      archived: false,
    };

    if (active !== null) {
      where.active = active === "true";
    }

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          links: {
            select: {
              id: true,
              slug: true,
              platform: true,
              linkNumber: true,
              createdAt: true,
              _count: {
                select: { clicks: true },
              },
            },
            orderBy: { createdAt: "desc" },
          },
          _count: {
            select: { links: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      db.product.count({ where }),
    ]);

    // Add stats per product
    const productsWithStats = await Promise.all(
      products.map(async (product) => {
        const linkIds = product.links.map((l) => l.id);
        const clickCount = await db.click.count({
          where: { linkId: { in: linkIds } },
        });

        // Group links by platform
        const platformCounts: Record<string, number> = {};
        product.links.forEach((link) => {
          platformCounts[link.platform] = (platformCounts[link.platform] || 0) + 1;
        });

        return {
          ...product,
          totalClicks: clickCount,
          platformCounts,
        };
      })
    );

    return NextResponse.json({
      products: productsWithStats,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + products.length < total,
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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

    // Get user's subscription tier
    const subscription = await db.subscription.findUnique({
      where: { userId: user.id },
    });
    const tier: SubscriptionTier = subscription?.tier || "HUSTLER";

    // Check product limit
    const currentProductCount = await db.product.count({
      where: { userId: user.id, archived: false },
    });

    if (!canCreateProduct(tier, currentProductCount)) {
      const tierConfig = getTierConfig(tier);
      const remaining = getRemainingProducts(tier, currentProductCount);
      return NextResponse.json(
        {
          error: "Product limit reached",
          message: `Your ${tierConfig.displayName} plan allows ${tierConfig.limits.maxProducts} products. Upgrade to create more.`,
          currentCount: currentProductCount,
          limit: tierConfig.limits.maxProducts,
          remaining,
          upgradeRequired: true,
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      shortCode,
      destinationUrl,
      routerType,
      routerConfig,
      imageUrl,
      description,
    } = body;

    // Validate required fields
    if (!name || !shortCode || !destinationUrl) {
      return NextResponse.json(
        { error: "name, shortCode, and destinationUrl are required" },
        { status: 400 }
      );
    }

    // Validate shortCode format
    if (!/^[a-zA-Z0-9-]+$/.test(shortCode)) {
      return NextResponse.json(
        { error: "shortCode can only contain letters, numbers, and hyphens" },
        { status: 400 }
      );
    }

    if (shortCode.length < 2 || shortCode.length > 20) {
      return NextResponse.json(
        { error: "shortCode must be between 2 and 20 characters" },
        { status: 400 }
      );
    }

    // Check if shortCode is unique for this user
    const existing = await db.product.findUnique({
      where: {
        userId_shortCode: {
          userId: user.id,
          shortCode: shortCode.toLowerCase(),
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You already have a product with this shortCode" },
        { status: 409 }
      );
    }

    // Validate URL
    try {
      new URL(destinationUrl);
    } catch {
      return NextResponse.json(
        { error: "Invalid destination URL" },
        { status: 400 }
      );
    }

    const product = await db.product.create({
      data: {
        userId: user.id,
        name,
        shortCode: shortCode.toLowerCase(),
        destinationUrl,
        routerType: (routerType as RouterType) || "STANDARD",
        routerConfig: routerConfig || null,
        imageUrl,
        description,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
