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
import { auth } from "@clerk/nextjs/server";

// Stripe Price IDs for each plan
const PLAN_PRICES: Record<string, string | undefined> = {
  CREATOR: process.env.STRIPE_PRICE_CREATOR,
  EMPIRE: process.env.STRIPE_PRICE_EMPIRE,
};

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const dbUser = await db.user.findUnique({
      where: { clerkId },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = dbUser.id;

    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { planId } = body;

    const priceId = PLAN_PRICES[planId];
    if (!planId || !priceId) {
      return NextResponse.json(
        { error: "Invalid plan ID or price not configured" },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    let customerId = dbUser.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: dbUser.email || undefined,
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
          price: priceId,
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
