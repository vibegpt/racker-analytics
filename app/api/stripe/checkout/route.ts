/**
 * STRIPE SUBSCRIPTION CHECKOUT
 *
 * Creates Stripe Checkout Sessions for plan upgrades.
 *
 * POST /api/stripe/checkout
 * Body: { planId: "CREATOR" | "EMPIRE" }
 */

import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { db } from "@/lib/db";
// TODO: Import from Clerk auth when ready
// import { auth } from "@clerk/nextjs";

// Stripe Price IDs for each plan
// These should be created in your Stripe dashboard
const PLAN_PRICES: Record<string, string> = {
  CREATOR: process.env.STRIPE_PRICE_CREATOR || "price_creator_monthly",
  EMPIRE: process.env.STRIPE_PRICE_EMPIRE || "price_empire_monthly",
};

export async function POST(req: NextRequest) {
  try {
    // TODO: Get actual user from Clerk
    // const { userId } = auth();
    const userId = "mock-user-id"; // Replace with actual auth

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { planId } = body;

    if (!planId || !PLAN_PRICES[planId]) {
      return NextResponse.json(
        { error: "Invalid plan ID" },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { email: true, stripeCustomerId: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: { userId },
      });
      customerId = customer.id;

      // Save customer ID to user
      await db.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create checkout session
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: PLAN_PRICES[planId],
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/dashboard/settings/billing?success=true&plan=${planId}`,
      cancel_url: `${baseUrl}/dashboard/settings/billing?canceled=true`,
      metadata: {
        userId,
        planId,
      },
      subscription_data: {
        metadata: {
          userId,
          planId,
        },
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("[Stripe Checkout] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
