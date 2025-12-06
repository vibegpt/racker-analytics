import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const { email, source, utmCampaign, utmMedium } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email required" },
        { status: 400 }
      );
    }

    // Get IP and user agent for analytics
    const headersList = await headers();
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0] ||
                      headersList.get("x-real-ip") ||
                      "unknown";
    const userAgent = headersList.get("user-agent") || undefined;

    // Check if email already exists
    const existing = await db.waitlistEntry.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      // Already on waitlist - still return success (don't reveal this)
      return NextResponse.json({ success: true, message: "Added to waitlist" });
    }

    // Create waitlist entry
    await db.waitlistEntry.create({
      data: {
        email: email.toLowerCase(),
        source: source || undefined,
        utmCampaign: utmCampaign || undefined,
        utmMedium: utmMedium || undefined,
        ipAddress,
        userAgent,
      },
    });

    return NextResponse.json({ success: true, message: "Added to waitlist" });
  } catch (error) {
    console.error("Waitlist error:", error);
    return NextResponse.json(
      { error: "Failed to join waitlist" },
      { status: 500 }
    );
  }
}

// Get waitlist count (for displaying on landing page)
export async function GET() {
  try {
    const count = await db.waitlistEntry.count();
    return NextResponse.json({ count });
  } catch (error) {
    console.error("Waitlist count error:", error);
    return NextResponse.json({ count: 0 });
  }
}
