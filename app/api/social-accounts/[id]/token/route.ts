import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import {
  checkTokenHealth,
  getValidAccessToken,
} from "@/lib/oauth/token-manager";

// GET /api/social-accounts/[id]/token - Check token health
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await getAuth(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify user owns this account
    const account = await db.socialAccount.findUnique({
      where: {
        id,
        userId,
      },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Social account not found" },
        { status: 404 }
      );
    }

    const health = await checkTokenHealth(id);

    return NextResponse.json(health);
  } catch (error) {
    console.error("Error checking token health:", error);
    return NextResponse.json(
      { error: "Failed to check token health" },
      { status: 500 }
    );
  }
}

// POST /api/social-accounts/[id]/token - Manually refresh token
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await getAuth(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify user owns this account
    const account = await db.socialAccount.findUnique({
      where: {
        id,
        userId,
      },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Social account not found" },
        { status: 404 }
      );
    }

    // Get valid access token (will refresh if needed)
    const result = await getValidAccessToken(id);

    return NextResponse.json({
      success: true,
      wasRefreshed: result.wasRefreshed,
      message: result.wasRefreshed
        ? "Token refreshed successfully"
        : "Token is still valid",
    });
  } catch (error) {
    console.error("Error refreshing token:", error);
    return NextResponse.json(
      {
        error: "Failed to refresh token",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
