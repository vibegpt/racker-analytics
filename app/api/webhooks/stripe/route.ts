/**
 * STRIPE WEBHOOK - Enhanced with Per-Post Attribution
 *
 * When a payment succeeds, checks for rckr_link in metadata to attribute
 * the sale to the specific SmartLink (and thus the specific post).
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { headers } from "next/headers";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");
  return new Stripe(key, { apiVersion: "2024-11-20.acacia" });
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log(`Received Stripe event: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "payment_intent.succeeded":
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        const subscription = event.data.object as Stripe.Subscription;
        console.log("Subscription event:", subscription.id);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Handle checkout.session.completed - best for attribution as it has client_reference_id
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log("Checkout completed:", session.id);

  // Look for rckr_link in metadata or client_reference_id
  const rckrLink = session.metadata?.rckr_link || session.client_reference_id;
  const rckrSession = session.metadata?.rckr;

  if (!rckrLink) {
    console.log("No rckr_link found in checkout session, skipping attribution");
    return;
  }

  // Find the SmartLink
  const link = await db.smartLink.findUnique({
    where: { id: rckrLink },
    include: { user: true, product: true },
  });

  if (!link) {
    console.log(`SmartLink not found for rckr_link: ${rckrLink}`);
    return;
  }

  // Create the Sale
  const sale = await db.sale.create({
    data: {
      stripePaymentIntentId: session.payment_intent as string || `checkout_${session.id}`,
      stripeCustomerId: session.customer as string || undefined,
      amount: session.amount_total || 0,
      currency: session.currency || "usd",
      userId: link.userId,
      customerEmail: session.customer_details?.email || undefined,
      customerName: session.customer_details?.name || undefined,
      productName: link.product?.name || undefined,
      status: "completed",
      metadata: {
        rckr_link: rckrLink,
        rckr_session: rckrSession,
        checkout_session_id: session.id,
        platform: link.platform,
        slug: link.slug,
      },
    },
  });

  console.log(`Sale created: ${sale.id} attributed to link ${link.slug}`);

  // Find the most recent click from this link (within 24 hours) for attribution
  const recentClick = await db.click.findFirst({
    where: {
      linkId: link.id,
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Create Attribution record
  if (recentClick) {
    await db.attribution.create({
      data: {
        userId: link.userId,
        clickId: recentClick.id,
        saleId: sale.id,
        linkId: link.id,
        confidenceScore: 1.0, // High confidence - direct attribution via metadata
        attributionMethod: "DIRECT",
      },
    });
    console.log(`Attribution created: click ${recentClick.id} → sale ${sale.id}`);
  } else {
    // Create attribution without specific click
    console.log(`No recent click found for link ${link.slug}, creating link-only attribution`);
  }

  // Update link stats (optional - for quick dashboard display)
  await db.smartLink.update({
    where: { id: link.id },
    data: {
      updatedAt: new Date(),
    },
  });
}

/**
 * Handle payment_intent.succeeded - fallback for direct payments
 */
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log("Payment succeeded:", paymentIntent.id);

  // Check if already processed via checkout.session.completed
  const existingSale = await db.sale.findUnique({
    where: { stripePaymentIntentId: paymentIntent.id },
  });

  if (existingSale) {
    console.log("Sale already exists for this payment, skipping");
    return;
  }

  // Look for rckr_link in metadata
  const rckrLink = paymentIntent.metadata?.rckr_link;
  const creatorId = paymentIntent.metadata?.creatorId;

  // If we have a rckr_link, attribute to that link
  if (rckrLink) {
    const link = await db.smartLink.findUnique({
      where: { id: rckrLink },
      include: { user: true, product: true },
    });

    if (link) {
      const sale = await db.sale.create({
        data: {
          stripePaymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          userId: link.userId,
          customerEmail: paymentIntent.receipt_email || undefined,
          productName: link.product?.name || undefined,
          status: "completed",
          metadata: {
            rckr_link: rckrLink,
            platform: link.platform,
            slug: link.slug,
          },
        },
      });

      console.log(`Sale created: ${sale.id} attributed to link ${link.slug}`);

      // Find recent click for attribution
      const recentClick = await db.click.findFirst({
        where: {
          linkId: link.id,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { createdAt: "desc" },
      });

      if (recentClick) {
        await db.attribution.create({
          data: {
            userId: link.userId,
            clickId: recentClick.id,
            saleId: sale.id,
            linkId: link.id,
            confidenceScore: 1.0,
            attributionMethod: "DIRECT",
          },
        });
      }
      return;
    }
  }

  // Fallback: create sale with just creatorId (no link attribution)
  if (creatorId) {
    await db.sale.create({
      data: {
        stripePaymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        userId: creatorId,
        customerEmail: paymentIntent.receipt_email || undefined,
        status: "completed",
      },
    });
    console.log("Sale created without link attribution (creatorId only)");
  }
}
