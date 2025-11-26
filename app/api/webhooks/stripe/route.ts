/**
 * STRIPE WEBHOOK - Enhanced with Attribution
 * 
 * Handles:
 * 1. Subscription events (for platform billing)
 * 2. Payment events (for creator revenue attribution)
 * 
 * Attribution Data Sources:
 * - PaymentIntent metadata (customer_ip, tracker_id, fingerprint)
 * - Charge billing_details (address, name, email)
 * - Charge payment_method_details (card country, wallet info)
 * - Stripe Radar (risk data with IP when available)
 * - Customer object (email, name, address)
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { attributeSale, getAdaptiveEngine } from "@/lib/attribution/attribution-service";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// ============================================================================
// TYPES
// ============================================================================

interface ExtractedCustomerData {
  email?: string;
  name?: string;
  ip?: string;
  country?: string;
  region?: string;
  city?: string;
  postalCode?: string;
  trackerId?: string;
  fingerprint?: string;
  userAgent?: string;
  cardCountry?: string;
  paymentMethod?: string;
}

// ============================================================================
// MAIN WEBHOOK HANDLER
// ============================================================================

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  try {
    switch (event.type) {
      // ========================================================================
      // SUBSCRIPTION EVENTS (Platform Billing)
      // ========================================================================
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(subscription);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      // ========================================================================
      // PAYMENT EVENTS (Creator Revenue - Attribution!)
      // ========================================================================
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentSucceeded(paymentIntent);
        break;
      }

      case "charge.succeeded": {
        const charge = event.data.object as Stripe.Charge;
        await handleChargeSucceeded(charge);
        break;
      }

      // Stripe Connect events (for creator accounts)
      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        await handleConnectAccountUpdated(account);
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

// ============================================================================
// ENHANCED CUSTOMER DATA EXTRACTION
// ============================================================================

/**
 * Extract all available customer data from a PaymentIntent
 * Combines data from multiple sources for best attribution matching
 */
async function extractCustomerData(
  paymentIntent: Stripe.PaymentIntent
): Promise<ExtractedCustomerData> {
  const data: ExtractedCustomerData = {};
  const metadata = paymentIntent.metadata || {};

  // 1. Extract from metadata (highest priority - set by our checkout)
  data.ip = metadata.customer_ip || metadata.ip || metadata.client_ip;
  data.trackerId = metadata.tracker_id || metadata.rckr_id || metadata.trackerId;
  data.fingerprint = metadata.fingerprint || metadata.fp;
  data.userAgent = metadata.user_agent || metadata.userAgent;
  
  console.log(`[Webhook] Metadata extraction: ip=${data.ip}, trackerId=${data.trackerId}, fp=${data.fingerprint}`);

  // 2. Get customer details
  if (paymentIntent.customer) {
    try {
      const customer = await stripe.customers.retrieve(
        paymentIntent.customer as string,
        { expand: ['address'] }
      );
      
      if (!customer.deleted) {
        data.email = customer.email || undefined;
        data.name = customer.name || undefined;
        
        // Customer address (if saved)
        if (customer.address) {
          data.country = data.country || customer.address.country || undefined;
          data.city = data.city || customer.address.city || undefined;
          data.region = data.region || customer.address.state || undefined;
          data.postalCode = data.postalCode || customer.address.postal_code || undefined;
        }
      }
    } catch (err) {
      console.error('[Webhook] Failed to retrieve customer:', err);
    }
  }

  // 3. Get detailed charge data (has billing details and payment method info)
  if (paymentIntent.latest_charge) {
    try {
      const charge = await stripe.charges.retrieve(
        paymentIntent.latest_charge as string,
        { expand: ['payment_method_details'] }
      );

      // Billing details (from checkout form)
      if (charge.billing_details) {
        data.email = data.email || charge.billing_details.email || undefined;
        data.name = data.name || charge.billing_details.name || undefined;
        
        if (charge.billing_details.address) {
          const addr = charge.billing_details.address;
          data.country = data.country || addr.country || undefined;
          data.city = data.city || addr.city || undefined;
          data.region = data.region || addr.state || undefined;
          data.postalCode = data.postalCode || addr.postal_code || undefined;
        }
      }

      // Payment method details (card country, wallet info)
      if (charge.payment_method_details) {
        const pmd = charge.payment_method_details;
        
        // Card country (where the card was issued)
        if (pmd.card) {
          data.cardCountry = pmd.card.country || undefined;
          data.paymentMethod = 'card';
          
          // If no country from billing, use card country as fallback
          if (!data.country && pmd.card.country) {
            data.country = pmd.card.country;
            console.log(`[Webhook] Using card country as fallback: ${data.country}`);
          }
        }
        
        // Digital wallet info (Apple Pay, Google Pay, etc.)
        if (pmd.card?.wallet) {
          data.paymentMethod = `card_${pmd.card.wallet.type}`;
        }
      }

      // Stripe Radar risk data (may contain IP)
      // Note: outcome.risk_level and outcome.risk_score are available
      // IP is in outcome.seller_message for some cases
      if (charge.outcome) {
        // Parse seller_message for potential IP info
        // Format varies, but sometimes includes "Stripe evaluated..."
        console.log(`[Webhook] Charge outcome: ${charge.outcome.risk_level}, type: ${charge.outcome.type}`);
      }

    } catch (err) {
      console.error('[Webhook] Failed to retrieve charge:', err);
    }
  }

  // 4. Try to get payment method for additional data
  if (paymentIntent.payment_method && typeof paymentIntent.payment_method === 'string') {
    try {
      const pm = await stripe.paymentMethods.retrieve(paymentIntent.payment_method);
      
      if (pm.billing_details) {
        data.email = data.email || pm.billing_details.email || undefined;
        data.name = data.name || pm.billing_details.name || undefined;
        
        if (pm.billing_details.address) {
          const addr = pm.billing_details.address;
          data.country = data.country || addr.country || undefined;
          data.city = data.city || addr.city || undefined;
          data.region = data.region || addr.state || undefined;
        }
      }
    } catch (err) {
      // Payment method might not be accessible
      console.log('[Webhook] Could not retrieve payment method');
    }
  }

  console.log(`[Webhook] Extracted customer data: email=${data.email}, country=${data.country}, city=${data.city}, ip=${data.ip}`);
  
  return data;
}

// ============================================================================
// PAYMENT HANDLERS (Creator Revenue Attribution)
// ============================================================================

/**
 * Handle successful payment - This is where attribution magic happens!
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log(`[Webhook] PaymentIntent succeeded: ${paymentIntent.id}`);

  // Extract metadata to find the creator/user
  const metadata = paymentIntent.metadata || {};
  const userId = metadata.userId || metadata.creator_id || metadata.seller_id || metadata.user_id;

  if (!userId) {
    // This might be a platform payment, not creator revenue
    console.log(`[Webhook] No userId in metadata, skipping attribution`);
    return;
  }

  // Extract all available customer data
  const customerData = await extractCustomerData(paymentIntent);

  // Check if sale already exists
  const existingSale = await db.sale.findUnique({
    where: { stripePaymentIntentId: paymentIntent.id }
  });

  if (existingSale) {
    console.log(`[Webhook] Sale already exists for ${paymentIntent.id}`);
    return;
  }

  // Create sale record with enhanced data
  const sale = await db.sale.create({
    data: {
      userId,
      stripePaymentIntentId: paymentIntent.id,
      stripeCustomerId: paymentIntent.customer as string | undefined,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency.toUpperCase(),
      status: 'succeeded',
      customerEmail: customerData.email,
      customerIp: customerData.ip,
      customerName: customerData.name,
      country: customerData.country,
      region: customerData.region,
      city: customerData.city,
      productName: metadata.product_name || metadata.productName || paymentIntent.description || undefined,
      metadata: {
        ...metadata,
        // Store additional extracted data for debugging
        _extracted: {
          cardCountry: customerData.cardCountry,
          paymentMethod: customerData.paymentMethod,
          trackerId: customerData.trackerId,
          fingerprint: customerData.fingerprint,
          postalCode: customerData.postalCode,
        }
      } as any
    }
  });

  console.log(`[Webhook] Created sale: ${sale.id} for $${sale.amount / 100}`);
  console.log(`[Webhook] Sale data: ip=${sale.customerIp}, country=${sale.country}, city=${sale.city}`);

  // 🎯 ATTRIBUTION: Connect this sale to a smart link click!
  try {
    const result = await attributeSale(sale, {
      windowMinutes: 24 * 60, // 24 hour attribution window
      minConfidence: 0.5
    });

    if (result.attributed) {
      console.log(`[Webhook] ✅ Sale attributed with ${(result.confidence * 100).toFixed(1)}% confidence (${result.matchType})`);
      
      if (result.matchedLink) {
        console.log(`[Webhook] Matched to link: ${result.matchedLink.slug}`);
      }
    } else {
      console.log(`[Webhook] ⚠️ Sale not attributed (${result.matchType})`);
    }
  } catch (err) {
    console.error('[Webhook] Attribution failed:', err);
    // Don't fail the webhook - attribution is async
  }
}

/**
 * Handle successful charge (backup for payment_intent.succeeded)
 */
async function handleChargeSucceeded(charge: Stripe.Charge) {
  // Most attribution happens in payment_intent.succeeded
  // This is a backup for direct charges or Stripe Connect
  
  if (charge.transfer_data?.destination) {
    // This is a Stripe Connect transfer to a creator
    console.log(`[Webhook] Connect charge to ${charge.transfer_data.destination}`);
    // Handle creator payouts if needed
  }
}

/**
 * Handle Stripe Connect account updates
 */
async function handleConnectAccountUpdated(account: Stripe.Account) {
  // Track creator account status
  console.log(`[Webhook] Connect account updated: ${account.id}`);
  
  // Update creator's Stripe Connect status in our DB
  if (account.metadata?.userId) {
    await db.user.update({
      where: { id: account.metadata.userId },
      data: {
        // Store connect account status if needed
      }
    }).catch(() => {
      // User might not exist yet
    });
  }
}

// ============================================================================
// SUBSCRIPTION HANDLERS (Platform Billing)
// ============================================================================

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  if (!userId) return;

  // For subscriptions
  if (session.subscription) {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );
    await createOrUpdateSubscription(userId, subscription);
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.userId;
  if (!userId) return;

  await createOrUpdateSubscription(userId, subscription);
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.userId;
  if (!userId) return;

  await db.subscription.update({
    where: { stripeSubId: subscription.id },
    data: {
      status: "canceled",
    },
  });

  // Downgrade user to free tier
  await db.user.update({
    where: { id: userId },
    data: { 
      // Reset to free tier features would go here
    },
  });
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  const subscription = await db.subscription.findUnique({
    where: { stripeSubId: subscriptionId },
  });

  if (!subscription) return;

  // Log successful payment
  console.log(`[Webhook] Invoice paid for subscription ${subscriptionId}`);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  const subscription = await db.subscription.findUnique({
    where: { stripeSubId: subscriptionId },
  });

  if (!subscription) return;

  // Update subscription status
  await db.subscription.update({
    where: { id: subscription.id },
    data: { status: "past_due" },
  });

  console.log(`[Webhook] Invoice payment failed for ${subscriptionId}`);
}

async function createOrUpdateSubscription(
  userId: string,
  subscription: Stripe.Subscription
) {
  const priceId = subscription.items.data[0].price.id;
  const tier = getTierFromPriceId(priceId);

  const subscriptionData = {
    userId,
    stripeSubId: subscription.id,
    stripeCustomerId: subscription.customer as string,
    stripePriceId: priceId,
    tier,
    status: subscription.status,
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  };

  await db.subscription.upsert({
    where: { stripeSubId: subscription.id },
    create: subscriptionData,
    update: subscriptionData,
  });

  console.log(`[Webhook] Subscription ${subscription.id} updated to ${tier}`);
}

function getTierFromPriceId(priceId: string): "HUSTLER" | "CREATOR" | "EMPIRE" {
  const priceMap: Record<string, "HUSTLER" | "CREATOR" | "EMPIRE"> = {
    [process.env.STRIPE_PRICE_ID_CREATOR_MONTHLY || '']: "CREATOR",
    [process.env.STRIPE_PRICE_ID_CREATOR_YEARLY || '']: "CREATOR",
    [process.env.STRIPE_PRICE_ID_EMPIRE_MONTHLY || '']: "EMPIRE",
    [process.env.STRIPE_PRICE_ID_EMPIRE_YEARLY || '']: "EMPIRE",
  };

  return priceMap[priceId] || "HUSTLER";
}
