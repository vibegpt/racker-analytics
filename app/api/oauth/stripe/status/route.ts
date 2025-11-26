/**
 * STRIPE CONNECTION STATUS API
 * 
 * GET /api/oauth/stripe/status - Get current connection status
 * DELETE /api/oauth/stripe/status - Disconnect Stripe account
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revokeStripeAccess, getConnectedAccount } from "@/lib/stripe/client";

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { clerkId },
      select: {
        stripeConnectId: true,
        stripeConnectStatus: true,
        stripeConnectOnboardedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If connected, get account details from Stripe
    let accountDetails = null;
    if (user.stripeConnectId && user.stripeConnectStatus === "active") {
      try {
        const account = await getConnectedAccount(user.stripeConnectId);
        accountDetails = {
          id: account.id,
          businessName: account.business_profile?.name || null,
          email: account.email || null,
          country: account.country || null,
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
        };
      } catch (err) {
        console.error("Failed to fetch Stripe account:", err);
        // Account may have been disconnected from Stripe side
        accountDetails = null;
      }
    }

    return NextResponse.json({
      connected: !!user.stripeConnectId && user.stripeConnectStatus === "active",
      status: user.stripeConnectStatus,
      connectedAt: user.stripeConnectOnboardedAt,
      account: accountDetails,
    });
  } catch (error) {
    console.error("Stripe status check error:", error);
    return NextResponse.json(
      { error: "Failed to check Stripe status" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { clerkId },
      select: {
        id: true,
        stripeConnectId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.stripeConnectId) {
      return NextResponse.json({ error: "No Stripe account connected" }, { status: 400 });
    }

    // Revoke access on Stripe side
    try {
      await revokeStripeAccess(user.stripeConnectId);
    } catch (err) {
      console.error("Failed to revoke Stripe access:", err);
      // Continue anyway - might already be disconnected
    }

    // Update user record
    await db.user.update({
      where: { id: user.id },
      data: {
        stripeConnectId: null,
        stripeConnectStatus: "disconnected",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Stripe disconnect error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect Stripe" },
      { status: 500 }
    );
  }
}
