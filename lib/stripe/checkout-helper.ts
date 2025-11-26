import Stripe from "stripe";
import { NextRequest } from "next/server";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");
  return new Stripe(key, { apiVersion: "2024-11-20.acacia" });
}

export interface TrackingData {
  trackerId?: string;
  fingerprint?: string;
  utmSource?: string;
  utmCampaign?: string;
  utmMedium?: string;
  ip?: string;
  userAgent?: string;
}

export function extractTrackingFromRequest(req: NextRequest): TrackingData {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "";
  const userAgent = req.headers.get("user-agent") || "";
  return { ip, userAgent };
}

export function createFingerprint(data: TrackingData): string {
  const str = `${data.ip}-${data.userAgent}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export async function createCreatorCheckout(params: {
  creatorStripeAccountId: string;
  priceInCents: number;
  productName: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
}) {
  const stripe = getStripe();
  return stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: params.customerEmail,
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: { name: params.productName },
        unit_amount: params.priceInCents,
      },
      quantity: 1,
    }],
    payment_intent_data: {
      application_fee_amount: Math.round(params.priceInCents * 0.1),
      transfer_data: { destination: params.creatorStripeAccountId },
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: params.metadata,
  });
}
