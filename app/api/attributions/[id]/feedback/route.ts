/**
 * ATTRIBUTION FEEDBACK API
 * 
 * POST /api/attributions/[id]/feedback
 * 
 * Allows users to confirm or reject an attribution.
 * Feeds back into the Adaptive Engine for model improvement.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { processAttributionFeedback } from "@/lib/attribution/attribution-service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: attributionId } = await params;

  try {
    const body = await request.json();
    const { confirmed } = body;

    if (typeof confirmed !== 'boolean') {
      return NextResponse.json(
        { error: "Missing 'confirmed' boolean in request body" },
        { status: 400 }
      );
    }

    // Verify the attribution belongs to this user
    const attribution = await db.attribution.findFirst({
      where: {
        id: attributionId,
        userId: userId
      }
    });

    if (!attribution) {
      return NextResponse.json(
        { error: "Attribution not found" },
        { status: 404 }
      );
    }

    // Process the feedback
    await processAttributionFeedback(attributionId, confirmed);

    return NextResponse.json({
      success: true,
      status: confirmed ? 'CONFIRMED' : 'REJECTED',
      message: `Attribution ${confirmed ? 'confirmed' : 'rejected'}. Thank you for the feedback!`
    });

  } catch (error) {
    console.error('[AttributionFeedback] Error:', error);
    return NextResponse.json(
      { error: "Failed to process feedback" },
      { status: 500 }
    );
  }
}
