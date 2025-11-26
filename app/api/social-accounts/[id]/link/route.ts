import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

// POST /api/social-accounts/[id]/link - Link a social account to a project
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
    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    // Verify user owns the social account
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

    // Verify user owns the project
    const project = await db.project.findUnique({
      where: {
        id: projectId,
        userId,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Link the account to the project (many-to-many relationship)
    await db.socialAccount.update({
      where: {
        id,
      },
      data: {
        linkedProjects: {
          connect: {
            id: projectId,
          },
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error linking social account:", error);
    return NextResponse.json(
      { error: "Failed to link social account" },
      { status: 500 }
    );
  }
}

// DELETE /api/social-accounts/[id]/link - Unlink a social account from a project
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
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    // Verify user owns the social account
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

    // Unlink the account from the project
    await db.socialAccount.update({
      where: {
        id,
      },
      data: {
        linkedProjects: {
          disconnect: {
            id: projectId,
          },
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error unlinking social account:", error);
    return NextResponse.json(
      { error: "Failed to unlink social account" },
      { status: 500 }
    );
  }
}
