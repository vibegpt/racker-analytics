/**
 * STRIPE CONNECT OAUTH - INITIATE
 * 
 * GET /api/oauth/stripe
 * 
 * Redirects user to Stripe to authorize their account connection.
 * Uses state parameter for CSRF protection.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getStripeConnectOAuthUrl } from "@/lib/stripe/client";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    // Get or create user
    let user = await db.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      // Create user if they don't exist yet
      const clerkUser = await fetch(`https://api.clerk.com/v1/users/${clerkId}`, {
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        },
      }).then(res => res.json());

      user = await db.user.create({
        data: {
          clerkId,
          email: clerkUser.email_addresses?.[0]?.email_address || `${clerkId}@temp.com`,
          name: `${clerkUser.first_name || ""} ${clerkUser.last_name || ""}`.trim() || null,
          avatarUrl: clerkUser.image_url || null,
        },
      });
    }

    // Check if already connected
    if (user.stripeConnectId && user.stripeConnectStatus === "active") {
      // Already connected - redirect back to onboarding
      const returnUrl = request.nextUrl.searchParams.get("return_url") || "/onboarding?step=1";
      return NextResponse.redirect(new URL(returnUrl, request.url));
    }

    // Generate state for CSRF protection (includes user ID and timestamp)
    const stateData = {
      userId: user.id,
      timestamp: Date.now(),
      returnUrl: request.nextUrl.searchParams.get("return_url") || "/onboarding?step=2",
    };
    const state = Buffer.from(JSON.stringify(stateData)).toString("base64url");

    // Get Stripe OAuth URL and redirect
    const oauthUrl = getStripeConnectOAuthUrl(state);
    
    return NextResponse.redirect(oauthUrl);
  } catch (error) {
    console.error("Stripe OAuth initiation error:", error);
    return NextResponse.redirect(
      new URL("/onboarding?step=1&error=stripe_init_failed", request.url)
    );
  }
}
