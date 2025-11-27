/**
 * PAGE VIEW TRACKING API
 *
 * Tracks page views on destination sites via the tracking script.
 * Called by the Racker tracking pixel/script embedded on user's sites.
 *
 * POST /api/t/pageview
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
      sessionId,
      fingerprint,
      pageUrl,
      pageTitle,
      referrer,
    } = body;

    if (!trackerId || !pageUrl) {
      return NextResponse.json(
        { error: "trackerId and pageUrl are required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Extract visitor info from headers
    const ipAddress =
      headersList.get("x-forwarded-for")?.split(",")[0] ||
      headersList.get("x-real-ip") ||
      headersList.get("cf-connecting-ip") ||
      "unknown";

    const userAgent = headersList.get("user-agent") || "unknown";

    // Geo info from Vercel headers
    const country = headersList.get("x-vercel-ip-country") || undefined;
    const region = headersList.get("x-vercel-ip-country-region") || undefined;
    const city = headersList.get("x-vercel-ip-city") || undefined;

    // Device detection
    const deviceType = getDeviceType(userAgent);
    const browser = getBrowser(userAgent);
    const os = getOS(userAgent);

    // Create page view record
    const pageView = await prisma.pageView.create({
      data: {
        linkId: linkId || null,
        trackerId,
        sessionId: sessionId || null,
        fingerprint: fingerprint || null,
        pageUrl,
        pageTitle: pageTitle || null,
        referrer: referrer || null,
        ipAddress,
        userAgent,
        country,
        region,
        city,
        deviceType,
        browser,
        os,
      },
    });

    console.log(`[PageView] Tracked: ${trackerId} on ${pageUrl}`);

    return NextResponse.json(
      { success: true, id: pageView.id },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("[PageView] Error:", error);
    return NextResponse.json(
      { error: "Failed to track page view" },
      { status: 500, headers: corsHeaders }
    );
  }
}

function getDeviceType(ua: string): string {
  const lower = ua.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(lower))
    return "tablet";
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile/.test(ua))
    return "mobile";
  return "desktop";
}

function getBrowser(ua: string): string {
  const lower = ua.toLowerCase();
  if (lower.includes("firefox")) return "Firefox";
  if (lower.includes("edg")) return "Edge";
  if (lower.includes("chrome")) return "Chrome";
  if (lower.includes("safari")) return "Safari";
  return "Unknown";
}

function getOS(ua: string): string {
  const lower = ua.toLowerCase();
  if (lower.includes("win")) return "Windows";
  if (lower.includes("mac")) return "macOS";
  if (lower.includes("linux")) return "Linux";
  if (lower.includes("android")) return "Android";
  if (lower.includes("iphone") || lower.includes("ipad")) return "iOS";
  return "Unknown";
}
