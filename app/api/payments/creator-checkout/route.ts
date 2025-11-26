/**
 * CREATOR CHECKOUT API
 * 
 * Creates Stripe Checkout Sessions for creator products with tracking.
 * This endpoint captures tracking data from the request and passes it
 * through to Stripe for attribution.
 * 
 * POST /api/payments/creator-checkout
 * Body: {
 *   creatorId: string      - Creator's user ID
 *   productName: string    - Product name
 *   amount: number         - Amount in cents
 *   currency?: string      - Currency (default: usd)
 *   successUrl: string     - Redirect after success
 *   cancelUrl: string      - Redirect on cancel
 *   customerEmail?: string - Pre-fill email
 *   trackerId?: string     - Racker tracker ID (from cookie)
 *   fingerprint?: string   - Browser fingerprint
 *   utmSource?: string     - UTM source
 *   utmCampaign?: string   - UTM campaign
 *   utmMedium?: string     - UTM medium
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { 
  createCreatorCheckout, 
  extractTrackingFromRequest,
  createFingerprint,
  TrackingData 
} from "@/lib/stripe/checkout-helper";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate required fields
    const { creatorId, productName, amount, successUrl, cancelUrl } = body;
    
    if (!creatorId) {
      return NextResponse.json({ error: "creatorId is required" }, { status: 400 });
    }
    if (!productName) {
      return NextResponse.json({ error: "productName is required" }, { status: 400 });
    }
    if (!amount || typeof amount !== 'number' || amount < 50) {
      return NextResponse.json({ error: "amount must be at least 50 cents" }, { status: 400 });
    }
    if (!successUrl) {
      return NextResponse.json({ error: "successUrl is required" }, { status: 400 });
    }
    if (!cancelUrl) {
      return NextResponse.json({ error: "cancelUrl is required" }, { status: 400 });
    }

    // Extract tracking data from request
    const serverTracking = await extractTrackingFromRequest();
    
    // Merge with client-provided tracking data
    const tracking: TrackingData = {
      // Server-side data (most reliable)
      ip: serverTracking.ip,
      userAgent: serverTracking.userAgent,
      
      // Client-side data (can be overridden)
      trackerId: body.trackerId || serverTracking.trackerId,
      fingerprint: body.fingerprint || createFingerprint(serverTracking.ip, serverTracking.userAgent),
      utmSource: body.utmSource,
      utmCampaign: body.utmCampaign,
      utmMedium: body.utmMedium,
    };

    console.log(`[CreatorCheckout] Creating checkout for creator ${creatorId}`);
    console.log(`[CreatorCheckout] Tracking: ip=${tracking.ip}, trackerId=${tracking.trackerId}, fp=${tracking.fingerprint}`);

    // Create the checkout session
    const session = await createCreatorCheckout({
      creatorId,
      productName,
      amount,
      currency: body.currency || 'usd',
      successUrl,
      cancelUrl,
      customerEmail: body.customerEmail,
      tracking,
      metadata: body.metadata,
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });

  } catch (error: any) {
    console.error('[CreatorCheckout] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for simple checkout links
 * 
 * GET /api/payments/creator-checkout?creatorId=xxx&productName=xxx&amount=999&successUrl=xxx&cancelUrl=xxx
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    
    const creatorId = searchParams.get('creatorId');
    const productName = searchParams.get('productName');
    const amount = parseInt(searchParams.get('amount') || '0', 10);
    const successUrl = searchParams.get('successUrl');
    const cancelUrl = searchParams.get('cancelUrl');
    const currency = searchParams.get('currency') || 'usd';
    
    // Validate
    if (!creatorId || !productName || !amount || !successUrl || !cancelUrl) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Extract tracking from request
    const tracking = await extractTrackingFromRequest();
    
    // Add fingerprint
    tracking.fingerprint = createFingerprint(tracking.ip, tracking.userAgent);
    
    // Get UTM params if present
    tracking.utmSource = searchParams.get('utm_source') || undefined;
    tracking.utmCampaign = searchParams.get('utm_campaign') || undefined;
    tracking.utmMedium = searchParams.get('utm_medium') || undefined;

    // Create session
    const session = await createCreatorCheckout({
      creatorId,
      productName,
      amount,
      currency,
      successUrl,
      cancelUrl,
      tracking,
    });

    // Redirect to Stripe Checkout
    if (session.url) {
      return NextResponse.redirect(session.url);
    }

    return NextResponse.json({ error: "Failed to create checkout URL" }, { status: 500 });

  } catch (error: any) {
    console.error('[CreatorCheckout] GET Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout' },
      { status: 500 }
    );
  }
}
