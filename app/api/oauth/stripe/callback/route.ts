/**
 * STRIPE CONNECT OAUTH - CALLBACK
 * 
 * GET /api/oauth/stripe/callback
 * 
 * Handles the OAuth callback from Stripe after user authorizes.
 * Exchanges the authorization code for tokens and stores the connection.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { exchangeStripeCode, getConnectedAccount } from "@/lib/stripe/client";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  // Use ngrok URL instead of localhost
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;

  try {
    const { userId: clerkId } = await auth();
    const searchParams = request.nextUrl.searchParams;

    // Check for errors from Stripe
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (error) {
      console.error("Stripe OAuth error:", error, errorDescription);
      return NextResponse.redirect(new URL(`/onboarding?step=1&error=${error}`, baseUrl));
    }

    // Get authorization code and state
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state) {
      console.error("Missing code or state in Stripe callback");
      return NextResponse.redirect(new URL("/onboarding?step=1&error=missing_params", baseUrl));
    }

    // Decode and validate state
    let stateData: { userId: string; timestamp: number; returnUrl: string };
    try {
      stateData = JSON.parse(Buffer.from(state, "base64url").toString());
    } catch {
      console.error("Invalid state parameter");
      return NextResponse.redirect(new URL("/onboarding?step=1&error=invalid_state", baseUrl));
    }

    // Check state timestamp (expire after 10 minutes)
    const TEN_MINUTES = 10 * 60 * 1000;
    if (Date.now() - stateData.timestamp > TEN_MINUTES) {
      console.error("State expired");
      return NextResponse.redirect(new URL("/onboarding?step=1&error=state_expired", baseUrl));
    }

    // Verify user is authenticated and matches state
    if (!clerkId) {
      return NextResponse.redirect(new URL("/sign-in", baseUrl));
    }

    const user = await db.user.findUnique({
      where: { clerkId },
    });

    if (!user || user.id !== stateData.userId) {
      console.error("User mismatch in OAuth callback");
      return NextResponse.redirect(new URL("/onboarding?step=1&error=user_mismatch", baseUrl));
    }

    // Exchange code for tokens
    const { stripeUserId, accessToken, refreshToken, scope } = await exchangeStripeCode(code);

    // Get account details from Stripe
    let accountDetails;
    try {
      accountDetails = await getConnectedAccount(stripeUserId);
    } catch (err) {
      console.error("Failed to fetch Stripe account details:", err);
    }

    // Update user with Stripe Connect info
    await db.user.update({
      where: { id: user.id },
      data: {
        stripeConnectId: stripeUserId,
        stripeConnectStatus: "active",
        stripeConnectOnboardedAt: new Date(),
      },
    });

    console.log("Stripe Connect successful:", {
      userId: user.id,
      stripeUserId,
      scope,
      businessName: accountDetails?.business_profile?.name,
    });

    // Redirect to next step in onboarding
    return NextResponse.redirect(new URL(stateData.returnUrl, baseUrl));
  } catch (error) {
    console.error("Stripe OAuth callback error:", error);
    return NextResponse.redirect(new URL("/onboarding?step=1&error=callback_failed", baseUrl));
  }
}
