import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { getValidAccessToken } from "@/lib/oauth/token-manager";

// POST /api/social-accounts/[id]/sync - Trigger manual sync for a social account
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

    // Check token validity and refresh if needed
    try {
      const tokenResult = await getValidAccessToken(id);

      if (tokenResult.wasRefreshed) {
        console.log(`[SYNC] Token was refreshed for account ${id}`);
      }
    } catch (error) {
      // Token refresh failed - return error
      return NextResponse.json(
        {
          error: "Failed to get valid access token",
          message: error instanceof Error ? error.message : "Unknown error",
          requiresReauth: true,
        },
        { status: 401 }
      );
    }

    // Update last synced timestamp
    const updated = await db.socialAccount.update({
      where: {
        id,
      },
      data: {
        lastSyncedAt: new Date(),
        syncStatus: "syncing",
      },
    });

    // TODO: Trigger background job to fetch new content from this platform
    // This would call the attribution engine to process new content
    // For now, we'll just update the timestamp

    // Simulate async background work
    setTimeout(async () => {
      try {
        await db.socialAccount.update({
          where: {
            id,
          },
          data: {
            syncStatus: "active",
          },
        });
      } catch (error) {
        console.error("Error updating sync status:", error);
      }
    }, 2000);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error syncing social account:", error);
    return NextResponse.json(
      { error: "Failed to sync social account" },
      { status: 500 }
    );
  }
}
