import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

// GET /api/social-accounts - Fetch all connected social accounts
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

    const accounts = await db.socialAccount.findMany({
      where: {
        userId: user.id,
        connected: true,
      },
      select: {
        id: true,
        platform: true,
        platformId: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        followerCount: true,
        isVerified: true,
        connected: true,
        connectedAt: true,
      },
      orderBy: {
        connectedAt: "desc",
      },
    });

    return NextResponse.json({
      accounts,
      count: accounts.length,
    });
  } catch (error) {
    console.error("Error fetching social accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch social accounts" },
      { status: 500 }
    );
  }
}

// DELETE /api/social-accounts?platform=youtube - Disconnect a social account
export async function DELETE(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const platform = request.nextUrl.searchParams.get("platform");
    
    if (!platform) {
      return NextResponse.json({ error: "Platform required" }, { status: 400 });
    }

    // Get user's internal ID
    const user = await db.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find and update the account (soft delete - just mark as disconnected)
    const account = await db.socialAccount.findFirst({
      where: {
        userId: user.id,
        platform: platform.toUpperCase() as any,
      },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    await db.socialAccount.update({
      where: { id: account.id },
      data: {
        connected: false,
        accessToken: null,
        refreshToken: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error disconnecting social account:", error);
    return NextResponse.json(
      { error: "Failed to disconnect account" },
      { status: 500 }
    );
  }
}
