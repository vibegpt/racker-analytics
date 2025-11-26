import Stripe from "stripe";

const stripeKey = process.env.STRIPE_SECRET_KEY || "";

export const stripe = stripeKey
  ? new Stripe(stripeKey, { apiVersion: "2025-04-30.basil" })
  : (null as unknown as Stripe);

export async function getStripeConnectOAuthUrl(userId: string) {
  if (!stripe) throw new Error("Stripe not configured");
  const clientId = process.env.STRIPE_CONNECT_CLIENT_ID;
  if (!clientId) throw new Error("STRIPE_CONNECT_CLIENT_ID not set");
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${clientId}&scope=read_write&redirect_uri=${baseUrl}/api/oauth/stripe/callback&state=${userId}`;
}

export async function exchangeStripeCode(code: string) {
  if (!stripe) throw new Error("Stripe not configured");
  return stripe.oauth.token({ grant_type: "authorization_code", code });
}

export async function getConnectedAccount(accountId: string) {
  if (!stripe) throw new Error("Stripe not configured");
  return stripe.accounts.retrieve(accountId);
}

export async function revokeStripeAccess(accountId: string) {
  if (!stripe) throw new Error("Stripe not configured");
  // Stripe doesn't have a direct revoke - just return success
  return { success: true };
}
