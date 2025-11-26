/**
 * STRIPE CLIENT
 * 
 * Shared Stripe client instance for API calls.
 */

import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-11-20.acacia",
  typescript: true,
});

/**
 * Get Stripe Connect OAuth URL
 */
export function getStripeConnectOAuthUrl(state: string): string {
  const clientId = process.env.STRIPE_CONNECT_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/stripe/callback`;
  
  if (!clientId) {
    throw new Error("STRIPE_CONNECT_CLIENT_ID is not set");
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: "read_write", // read_only or read_write
    redirect_uri: redirectUri,
    state: state, // CSRF protection
  });

  return `https://connect.stripe.com/oauth/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for access token and account ID
 */
export async function exchangeStripeCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  stripeUserId: string;
  scope: string;
}> {
  const response = await stripe.oauth.token({
    grant_type: "authorization_code",
    code: code,
  });

  if (!response.stripe_user_id) {
    throw new Error("No stripe_user_id in OAuth response");
  }

  return {
    accessToken: response.access_token || "",
    refreshToken: response.refresh_token || "",
    stripeUserId: response.stripe_user_id,
    scope: response.scope || "",
  };
}

/**
 * Refresh an expired access token
 */
export async function refreshStripeToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  const response = await stripe.oauth.token({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  return {
    accessToken: response.access_token || "",
    refreshToken: response.refresh_token || refreshToken,
  };
}

/**
 * Revoke access to a connected account
 */
export async function revokeStripeAccess(stripeUserId: string): Promise<void> {
  await stripe.oauth.deauthorize({
    client_id: process.env.STRIPE_CONNECT_CLIENT_ID!,
    stripe_user_id: stripeUserId,
  });
}

/**
 * Get connected account details
 */
export async function getConnectedAccount(stripeUserId: string): Promise<Stripe.Account> {
  return stripe.accounts.retrieve(stripeUserId);
}

/**
 * List charges for a connected account
 */
export async function listConnectedAccountCharges(
  stripeUserId: string,
  options?: Stripe.ChargeListParams
): Promise<Stripe.ApiList<Stripe.Charge>> {
  return stripe.charges.list(options || {}, {
    stripeAccount: stripeUserId,
  });
}

/**
 * List payment intents for a connected account
 */
export async function listConnectedAccountPaymentIntents(
  stripeUserId: string,
  options?: Stripe.PaymentIntentListParams
): Promise<Stripe.ApiList<Stripe.PaymentIntent>> {
  return stripe.paymentIntents.list(options || {}, {
    stripeAccount: stripeUserId,
  });
}
