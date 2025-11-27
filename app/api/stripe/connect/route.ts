/**
 * STRIPE CONNECT
 *
 * Initiates Stripe Connect OAuth flow for revenue attribution.
 *
 * POST /api/stripe/connect
 */

import { NextRequest, NextResponse } from "next/server";
import { getStripeConnectOAuthUrl } from "@/lib/stripe/client";
// TODO: Import from Clerk auth when ready
// import { auth } from "@clerk/nextjs";

export async function POST(req: NextRequest) {
  try {
    // TODO: Get actual user from Clerk
    // const { userId } = auth();
    const userId = "mock-user-id"; // Replace with actual auth

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = await getStripeConnectOAuthUrl(userId);
    return NextResponse.json({ url });
  } catch (error: any) {
    console.error("[Stripe Connect] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create connect URL" },
      { status: 500 }
    );
  }
}
