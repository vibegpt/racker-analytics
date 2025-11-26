/**
 * STRIPE CHECKOUT HELPER FOR CREATORS
 * 
 * Provides utilities for creating Stripe checkout sessions and payment links
 * that properly pass tracking data for attribution.
 * 
 * Usage:
 * 1. Frontend captures tracker_id from cookie and fingerprint
 * 2. Passes to createCreatorCheckout() or createPaymentIntent()
 * 3. Tracking data is stored in Stripe metadata
 * 4. Webhook extracts data for attribution matching
 */

import Stripe from "stripe";
import { cookies, headers } from "next/headers";

// ============================================================================
// TYPES
// ============================================================================

export interface TrackingData {
  /** Racker tracker ID from cookie (rckr_id) */
  trackerId?: string;
  /** Browser fingerprint hash */
  fingerprint?: string;
  /** Customer IP address */
  ip?: string;
  /** User agent string */
  userAgent?: string;
  /** UTM source */
  utmSource?: string;
  /** UTM campaign */
  utmCampaign?: string;
  /** UTM medium */
  utmMedium?: string;
}

export interface CreateCheckoutParams {
  /** Creator's user ID */
  creatorId: string;
  /** Product name for display */
  productName: string;
  /** Amount in cents */
  amount: number;
  /** Currency (default: usd) */
  currency?: string;
  /** Success redirect URL */
  successUrl: string;
  /** Cancel redirect URL */
  cancelUrl: string;
  /** Customer's email (optional, for prefill) */
  customerEmail?: string;
  /** Tracking data from frontend */
  tracking?: TrackingData;
  /** Additional metadata */
  metadata?: Record<string, string>;
}

export interface CreatePaymentIntentParams {
  /** Creator's user ID */
  creatorId: string;
  /** Product name */
  productName: string;
  /** Amount in cents */
  amount: number;
  /** Currency (default: usd) */
  currency?: string;
  /** Customer's Stripe ID (optional) */
  customerId?: string;
  /** Tracking data from frontend */
  tracking?: TrackingData;
  /** Additional metadata */
  metadata?: Record<string, string>;
}

// ============================================================================
// STRIPE CLIENT
// ============================================================================

let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2024-11-20.acacia",
    });
  }
  return stripeInstance;
}

// ============================================================================
// TRACKING DATA EXTRACTION (Server-Side)
// ============================================================================

const TRACKER_COOKIE = 'rckr_id';

/**
 * Extract tracking data from server request
 * Call this from API routes to get tracking info
 */
export async function extractTrackingFromRequest(): Promise<TrackingData> {
  const tracking: TrackingData = {};
  
  try {
    // Get tracker ID from cookie
    const cookieStore = await cookies();
    tracking.trackerId = cookieStore.get(TRACKER_COOKIE)?.value;
    
    // Get IP and user agent from headers
    const headersList = await headers();
    
    tracking.ip = 
      headersList.get('x-forwarded-for')?.split(',')[0] ||
      headersList.get('x-real-ip') ||
      headersList.get('cf-connecting-ip') ||
      undefined;
    
    tracking.userAgent = headersList.get('user-agent') || undefined;
    
  } catch (err) {
    console.error('[StripeCheckout] Failed to extract tracking:', err);
  }
  
  return tracking;
}

/**
 * Create fingerprint hash from request data
 * Simple hash for fallback matching
 */
export function createFingerprint(ip?: string, userAgent?: string): string | undefined {
  if (!ip && !userAgent) return undefined;
  
  const data = `${ip || ''}|${(userAgent || '').substring(0, 50)}`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

// ============================================================================
// CHECKOUT SESSION CREATION
// ============================================================================

/**
 * Create a Stripe Checkout Session with tracking data
 * Use this for one-time purchases with redirect flow
 */
export async function createCreatorCheckout(
  params: CreateCheckoutParams
): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe();
  const { tracking = {} } = params;
  
  // Build metadata with tracking data
  const metadata: Record<string, string> = {
    userId: params.creatorId,
    creator_id: params.creatorId,
    product_name: params.productName,
    ...params.metadata,
  };
  
  // Add tracking data to metadata
  if (tracking.trackerId) {
    metadata.tracker_id = tracking.trackerId;
    metadata.rckr_id = tracking.trackerId;
  }
  if (tracking.fingerprint) {
    metadata.fingerprint = tracking.fingerprint;
  }
  if (tracking.ip) {
    metadata.customer_ip = tracking.ip;
  }
  if (tracking.userAgent) {
    // Truncate user agent to fit Stripe's 500 char limit
    metadata.user_agent = tracking.userAgent.substring(0, 200);
  }
  if (tracking.utmSource) {
    metadata.utm_source = tracking.utmSource;
  }
  if (tracking.utmCampaign) {
    metadata.utm_campaign = tracking.utmCampaign;
  }
  if (tracking.utmMedium) {
    metadata.utm_medium = tracking.utmMedium;
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: params.currency || 'usd',
          product_data: {
            name: params.productName,
          },
          unit_amount: params.amount,
        },
        quantity: 1,
      },
    ],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    customer_email: params.customerEmail,
    metadata,
    payment_intent_data: {
      metadata, // Also add to payment intent for webhook access
    },
  });

  console.log(`[StripeCheckout] Created session ${session.id} for creator ${params.creatorId}`);
  
  return session;
}

// ============================================================================
// PAYMENT INTENT CREATION
// ============================================================================

/**
 * Create a Payment Intent with tracking data
 * Use this for custom payment flows (Elements, etc.)
 */
export async function createCreatorPaymentIntent(
  params: CreatePaymentIntentParams
): Promise<Stripe.PaymentIntent> {
  const stripe = getStripe();
  const { tracking = {} } = params;
  
  // Build metadata with tracking data
  const metadata: Record<string, string> = {
    userId: params.creatorId,
    creator_id: params.creatorId,
    product_name: params.productName,
    ...params.metadata,
  };
  
  // Add tracking data
  if (tracking.trackerId) {
    metadata.tracker_id = tracking.trackerId;
    metadata.rckr_id = tracking.trackerId;
  }
  if (tracking.fingerprint) {
    metadata.fingerprint = tracking.fingerprint;
  }
  if (tracking.ip) {
    metadata.customer_ip = tracking.ip;
  }
  if (tracking.userAgent) {
    metadata.user_agent = tracking.userAgent.substring(0, 200);
  }
  if (tracking.utmSource) {
    metadata.utm_source = tracking.utmSource;
  }
  if (tracking.utmCampaign) {
    metadata.utm_campaign = tracking.utmCampaign;
  }
  if (tracking.utmMedium) {
    metadata.utm_medium = tracking.utmMedium;
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: params.amount,
    currency: params.currency || 'usd',
    customer: params.customerId,
    metadata,
    automatic_payment_methods: {
      enabled: true,
    },
  });

  console.log(`[StripeCheckout] Created PaymentIntent ${paymentIntent.id} for creator ${params.creatorId}`);
  
  return paymentIntent;
}

// ============================================================================
// PAYMENT LINK CREATION
// ============================================================================

export interface CreatePaymentLinkParams {
  /** Creator's user ID */
  creatorId: string;
  /** Product name */
  productName: string;
  /** Amount in cents */
  amount: number;
  /** Currency (default: usd) */
  currency?: string;
  /** Allow customer to adjust quantity */
  adjustableQuantity?: boolean;
  /** Additional metadata */
  metadata?: Record<string, string>;
}

/**
 * Create a reusable Payment Link
 * Note: Payment Links have limited metadata support
 * Consider using Checkout Sessions for better tracking
 */
export async function createCreatorPaymentLink(
  params: CreatePaymentLinkParams
): Promise<Stripe.PaymentLink> {
  const stripe = getStripe();
  
  // First create a product and price
  const product = await stripe.products.create({
    name: params.productName,
    metadata: {
      creator_id: params.creatorId,
    },
  });

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: params.amount,
    currency: params.currency || 'usd',
  });

  // Create the payment link
  const paymentLink = await stripe.paymentLinks.create({
    line_items: [
      {
        price: price.id,
        quantity: 1,
        adjustable_quantity: params.adjustableQuantity ? {
          enabled: true,
          minimum: 1,
          maximum: 10,
        } : undefined,
      },
    ],
    metadata: {
      userId: params.creatorId,
      creator_id: params.creatorId,
      product_name: params.productName,
      ...params.metadata,
    },
    // Payment Links don't support payment_intent_data metadata
    // The metadata above will be on the Checkout Session
  });

  console.log(`[StripeCheckout] Created PaymentLink ${paymentLink.id} for creator ${params.creatorId}`);
  
  return paymentLink;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Update an existing Payment Intent with tracking data
 * Useful if you create the PI first, then get tracking data
 */
export async function updatePaymentIntentTracking(
  paymentIntentId: string,
  tracking: TrackingData
): Promise<Stripe.PaymentIntent> {
  const stripe = getStripe();
  
  const metadata: Record<string, string> = {};
  
  if (tracking.trackerId) {
    metadata.tracker_id = tracking.trackerId;
    metadata.rckr_id = tracking.trackerId;
  }
  if (tracking.fingerprint) {
    metadata.fingerprint = tracking.fingerprint;
  }
  if (tracking.ip) {
    metadata.customer_ip = tracking.ip;
  }
  if (tracking.userAgent) {
    metadata.user_agent = tracking.userAgent.substring(0, 200);
  }
  
  const paymentIntent = await stripe.paymentIntents.update(paymentIntentId, {
    metadata,
  });
  
  console.log(`[StripeCheckout] Updated PaymentIntent ${paymentIntentId} with tracking`);
  
  return paymentIntent;
}

/**
 * Verify a checkout session completed successfully
 */
export async function verifyCheckoutSession(
  sessionId: string
): Promise<{
  success: boolean;
  paymentIntentId?: string;
  metadata?: Record<string, string>;
}> {
  const stripe = getStripe();
  
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status === 'paid') {
      return {
        success: true,
        paymentIntentId: session.payment_intent as string,
        metadata: session.metadata as Record<string, string>,
      };
    }
    
    return { success: false };
  } catch (err) {
    console.error('[StripeCheckout] Failed to verify session:', err);
    return { success: false };
  }
}
