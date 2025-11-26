import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

// GET /api/attributions/review - Fetch pending manual reviews
export async function GET(request: NextRequest) {
  try {
    const { userId } = await getAuth(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    // Build where clause
    const where: any = {
      project: {
        userId,
      },
      confidence: {
        gte: 50,
        lt: 75,
      },
      reviewStatus: "pending", // Assuming we add this field to the schema
    };

    if (projectId) {
      where.projectId = projectId;
    }

    const reviews = await db.attribution.findMany({
      where,
      include: {
        content: true,
        project: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
      orderBy: {
        postedAt: "desc",
      },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

// POST /api/attributions/review - Approve or reject a manual review
export async function POST(request: NextRequest) {
  try {
    const { userId } = await getAuth(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { attributionId, action, newProjectId } = body;

    if (!attributionId || !action) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!["approve", "reject", "reassign"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Fetch the attribution
    const attribution = await db.attribution.findUnique({
      where: {
        id: attributionId,
      },
      include: {
        project: true,
      },
    });

    if (!attribution) {
      return NextResponse.json(
        { error: "Attribution not found" },
        { status: 404 }
      );
    }

    // Verify user owns the project
    if (attribution.project.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (action === "approve") {
      // Approve: bump confidence to 100%
      const updated = await db.attribution.update({
        where: {
          id: attributionId,
        },
        data: {
          confidence: 100,
          reason: "manual_approval",
          reviewStatus: "approved",
        },
        include: {
          content: true,
        },
      });

      return NextResponse.json(updated);
    } else if (action === "reject") {
      // Reject: set confidence to 0 or delete
      await db.attribution.delete({
        where: {
          id: attributionId,
        },
      });

      return NextResponse.json({ success: true });
    } else if (action === "reassign") {
      // Reassign: change projectId and bump confidence
      if (!newProjectId) {
        return NextResponse.json(
          { error: "newProjectId is required for reassign action" },
          { status: 400 }
        );
      }

      // Verify user owns the new project
      const newProject = await db.project.findUnique({
        where: {
          id: newProjectId,
          userId,
        },
      });

      if (!newProject) {
        return NextResponse.json(
          { error: "New project not found" },
          { status: 404 }
        );
      }

      const updated = await db.attribution.update({
        where: {
          id: attributionId,
        },
        data: {
          projectId: newProjectId,
          confidence: 100,
          reason: "manual_reassignment",
          reviewStatus: "approved",
        },
        include: {
          content: true,
        },
      });

      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error processing review:", error);
    return NextResponse.json(
      { error: "Failed to process review" },
      { status: 500 }
    );
  }
}
