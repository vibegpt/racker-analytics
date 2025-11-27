/**
 * FORM CONVERSION TRACKING API
 *
 * Tracks form submissions on destination sites.
 * Called by the Racker tracking script when a form is submitted.
 *
 * POST /api/t/form
 */

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { headers } from "next/headers";

const prisma = new PrismaClient();

// CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const headersList = await headers();

    const {
      trackerId,
      linkId,
      fingerprint,
      formId,
      formName,
      pageUrl,
      email,
      name,
      phone,
      metadata,
    } = body;

    if (!pageUrl) {
      return NextResponse.json(
        { error: "pageUrl is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Extract IP from headers
    const ipAddress =
      headersList.get("x-forwarded-for")?.split(",")[0] ||
      headersList.get("x-real-ip") ||
      headersList.get("cf-connecting-ip") ||
      "unknown";

    // Try to find the original click to attribute this conversion
    let matchedClick = null;
    let confidenceScore = 0;
    const matchedBy: Record<string, boolean> = {};

    // Strategy 1: Match by tracker ID (highest confidence)
    if (trackerId) {
      matchedClick = await prisma.click.findFirst({
        where: {
          link: {
            id: linkId || undefined,
          },
        },
        orderBy: { clickedAt: "desc" },
        include: { link: true },
      });

      // Search in recent clicks for this tracker (via page views)
      const recentPageView = await prisma.pageView.findFirst({
        where: { trackerId },
        orderBy: { viewedAt: "desc" },
      });

      if (recentPageView?.linkId) {
        matchedClick = await prisma.click.findFirst({
          where: { linkId: recentPageView.linkId },
          orderBy: { clickedAt: "desc" },
        });
        if (matchedClick) {
          confidenceScore += 0.4;
          matchedBy.trackerId = true;
        }
      }
    }

    // Strategy 2: Match by link ID (from URL param)
    if (linkId && !matchedClick) {
      matchedClick = await prisma.click.findFirst({
        where: { linkId },
        orderBy: { clickedAt: "desc" },
      });
      if (matchedClick) {
        confidenceScore += 0.35;
        matchedBy.linkId = true;
      }
    }

    // Strategy 3: Match by IP address (fallback)
    if (!matchedClick && ipAddress !== "unknown") {
      // Look for clicks from same IP in last 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      matchedClick = await prisma.click.findFirst({
        where: {
          ipAddress,
          clickedAt: { gte: oneDayAgo },
        },
        orderBy: { clickedAt: "desc" },
      });
      if (matchedClick) {
        confidenceScore += 0.25;
        matchedBy.ipMatch = true;
      }
    }

    // Calculate time since click
    let timeSinceClick: number | null = null;
    if (matchedClick) {
      timeSinceClick = Math.floor(
        (Date.now() - matchedClick.clickedAt.getTime()) / 60000
      );

      // Time-based confidence boost
      if (timeSinceClick <= 30) {
        confidenceScore += 0.2; // Within 30 mins
      } else if (timeSinceClick <= 120) {
        confidenceScore += 0.1; // Within 2 hours
      }
    }

    // Cap confidence at 1.0
    confidenceScore = Math.min(1.0, confidenceScore);

    // Create form conversion record
    const formConversion = await prisma.formConversion.create({
      data: {
        linkId: matchedClick?.linkId || linkId || null,
        clickId: matchedClick?.id || null,
        trackerId: trackerId || null,
        fingerprint: fingerprint || null,
        ipAddress,
        formId: formId || null,
        formName: formName || null,
        pageUrl,
        email: email || null,
        name: name || null,
        phone: phone || null,
        metadata: metadata || null,
        confidenceScore,
        matchedBy,
        timeSinceClick,
      },
    });

    console.log(
      `[FormConversion] Tracked: ${formConversion.id} (confidence: ${(confidenceScore * 100).toFixed(0)}%)`
    );

    // Return success with attribution info
    return NextResponse.json(
      {
        success: true,
        id: formConversion.id,
        attributed: !!matchedClick,
        confidence: confidenceScore,
        linkId: matchedClick?.linkId || null,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("[FormConversion] Error:", error);
    return NextResponse.json(
      { error: "Failed to track form conversion" },
      { status: 500, headers: corsHeaders }
    );
  }
}
