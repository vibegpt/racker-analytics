import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

// GET /api/social-accounts/[id] - Fetch a single social account
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

    const account = await db.socialAccount.findUnique({
      where: {
        id,
        userId,
      },
      include: {
        linkedProjects: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Social account not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(account);
  } catch (error) {
    console.error("Error fetching social account:", error);
    return NextResponse.json(
      { error: "Failed to fetch social account" },
      { status: 500 }
    );
  }
}

// PATCH /api/social-accounts/[id] - Update a social account
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await getAuth(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Verify user owns this account
    const existingAccount = await db.socialAccount.findUnique({
      where: {
        id,
        userId,
      },
    });

    if (!existingAccount) {
      return NextResponse.json(
        { error: "Social account not found" },
        { status: 404 }
      );
    }

    // Update the account
    const account = await db.socialAccount.update({
      where: {
        id,
      },
      data: {
        ...(body.displayName && { displayName: body.displayName }),
        ...(body.avatarUrl !== undefined && { avatarUrl: body.avatarUrl }),
        ...(body.accessToken && { accessToken: body.accessToken }),
        ...(body.refreshToken !== undefined && {
          refreshToken: body.refreshToken,
        }),
        ...(body.followerCount !== undefined && {
          followerCount: body.followerCount,
        }),
        ...(body.isVerified !== undefined && { isVerified: body.isVerified }),
        ...(body.syncStatus && { syncStatus: body.syncStatus }),
      },
      include: {
        linkedProjects: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    return NextResponse.json(account);
  } catch (error) {
    console.error("Error updating social account:", error);
    return NextResponse.json(
      { error: "Failed to update social account" },
      { status: 500 }
    );
  }
}

// DELETE /api/social-accounts/[id] - Disconnect a social account
export async function DELETE(
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
    const existingAccount = await db.socialAccount.findUnique({
      where: {
        id,
        userId,
      },
    });

    if (!existingAccount) {
      return NextResponse.json(
        { error: "Social account not found" },
        { status: 404 }
      );
    }

    // Delete the account (this will also remove project links via Prisma cascade)
    await db.socialAccount.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting social account:", error);
    return NextResponse.json(
      { error: "Failed to delete social account" },
      { status: 500 }
    );
  }
}
