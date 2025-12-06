/**
 * GUMROAD WEBHOOK - Sale Attribution via URL Parameters
 *
 * When a Gumroad sale occurs, checks for rckr param in url_params
 * to attribute the sale to the specific SmartLink (and thus the specific post).
 *
 * Gumroad Ping docs: https://gumroad.com/ping
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

// Gumroad webhook payload interface
interface GumroadPing {
  sale_id: string;
  sale_timestamp: string;
  order_number: string;
  seller_id: string;
  product_id: string;
  product_permalink: string;
  product_name: string;
  price: number; // in cents
  quantity: number;
  email: string;
  full_name?: string;
  purchaser_id?: string;
  ip_country?: string;
  url_params?: string; // Our tracking params live here!
  referrer?: string;
  affiliate?: string;
  affiliate_credit_amount_cents?: number;
  is_recurring_charge?: boolean;
  recurrence?: string;
  refunded?: boolean;
  test?: boolean;
  custom_fields?: Record<string, string>;
  license_key?: string;
  variants?: Record<string, string>;
}

/**
 * Verify Gumroad webhook signature
 * Gumroad uses HMAC SHA256 with your secret
 */
function verifyGumroadSignature(
  body: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false;

  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(body);
  const expectedSignature = hmac.digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Parse url_params string to extract rckr tracking ID
 * url_params comes as "key1=value1&key2=value2" format
 */
function extractRckrLink(urlParams: string | undefined): string | null {
  if (!urlParams) return null;

  const params = new URLSearchParams(urlParams);
  // Check for various param names we might use
  return params.get("rckr") || params.get("rckr_link") || params.get("ref") || null;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-gumroad-signature");
  const gumroadSecret = process.env.GUMROAD_WEBHOOK_SECRET;

  // Verify signature if secret is configured
  if (gumroadSecret && !verifyGumroadSignature(body, signature, gumroadSecret)) {
    console.error("Gumroad webhook signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Parse the form-encoded body (Gumroad sends form data, not JSON)
  const formData = new URLSearchParams(body);
  const ping: Partial<GumroadPing> = {};

  for (const [key, value] of formData.entries()) {
    (ping as any)[key] = value;
  }

  console.log(`Received Gumroad ping: sale_id=${ping.sale_id}, product=${ping.product_name}`);

  // Log test pings but process them anyway (owner purchases are marked as test)
  const isTest = ping.test === true || ping.test === "true" as any;
  if (isTest) {
    console.log("Test ping received - processing anyway (owner purchase)");
  }

  // Skip refunds (handle separately if needed)
  if (ping.refunded === true || ping.refunded === "true" as any) {
    console.log("Refund ping received, skipping for now");
    return NextResponse.json({ received: true, refund: true });
  }

  try {
    // Check if sale already exists (idempotency)
    const existingSale = await db.sale.findUnique({
      where: { stripePaymentIntentId: `gumroad_${ping.sale_id}` },
    });

    if (existingSale) {
      console.log("Sale already processed, skipping");
      return NextResponse.json({ received: true, duplicate: true });
    }

    // Extract rckr tracking link from url_params
    const rckrLink = extractRckrLink(ping.url_params);

    if (!rckrLink) {
      console.log("No rckr tracking param found in url_params, skipping attribution");
      return NextResponse.json({ received: true, attributed: false });
    }

    // Find the SmartLink
    const link = await db.smartLink.findUnique({
      where: { id: rckrLink },
      include: { user: true, product: true },
    });

    if (!link) {
      console.log(`SmartLink not found for rckr: ${rckrLink}`);
      return NextResponse.json({ received: true, linkNotFound: true });
    }

    // Create the Sale record
    const sale = await db.sale.create({
      data: {
        stripePaymentIntentId: `gumroad_${ping.sale_id}`, // Prefix to distinguish from Stripe
        amount: parseInt(String(ping.price)) || 0, // Gumroad sends price as string, parse to int
        currency: "usd", // Gumroad primarily USD
        userId: link.userId,
        customerEmail: ping.email || undefined,
        customerName: ping.full_name || undefined,
        country: ping.ip_country || undefined,
        productName: ping.product_name || link.product?.name || undefined,
        status: "completed",
        metadata: {
          source: "gumroad",
          rckr_link: rckrLink,
          gumroad_sale_id: ping.sale_id,
          gumroad_order_number: ping.order_number,
          gumroad_product_id: ping.product_id,
          platform: link.platform,
          slug: link.slug,
          referrer: ping.referrer,
          affiliate: ping.affiliate,
          is_recurring: ping.is_recurring_charge,
        },
      },
    });

    console.log(`Gumroad sale created: ${sale.id} attributed to link ${link.slug}`);

    // Find the most recent click from this link (within 24 hours) for attribution
    const recentClick = await db.click.findFirst({
      where: {
        linkId: link.id,
        clickedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      orderBy: { clickedAt: "desc" },
    });

    // Create Attribution record
    if (recentClick) {
      await db.attribution.create({
        data: {
          userId: link.userId,
          clickId: recentClick.id,
          saleId: sale.id,
          linkId: link.id,
          confidenceScore: 1.0, // High confidence - direct attribution via url_params
          status: "CONFIRMED",
          matchedBy: { method: "DIRECT", source: "gumroad_url_params" },
        },
      });
      console.log(`Attribution created: click ${recentClick.id} → sale ${sale.id}`);
    } else {
      console.log(`No recent click found for link ${link.slug}, sale recorded without click attribution`);
    }

    // Update link stats
    await db.smartLink.update({
      where: { id: link.id },
      data: {
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      received: true,
      attributed: true,
      saleId: sale.id,
    });

  } catch (error: any) {
    console.error("Gumroad webhook processing error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
