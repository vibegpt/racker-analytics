/**
 * Stripe Module
 * 
 * Utilities for Stripe integration with attribution tracking.
 */

// Stripe client and Connect OAuth
export {
  stripe,
  getStripeConnectOAuthUrl,
  exchangeStripeCode,
  refreshStripeToken,
  revokeStripeAccess,
  getConnectedAccount,
  listConnectedAccountCharges,
  listConnectedAccountPaymentIntents,
} from './client';

// Checkout helpers for attribution tracking
export {
  // Types
  type TrackingData,
  type CreateCheckoutParams,
  type CreatePaymentIntentParams,
  type CreatePaymentLinkParams,
  
  // Checkout creation
  createCreatorCheckout,
  createCreatorPaymentIntent,
  createCreatorPaymentLink,
  
  // Tracking utilities
  extractTrackingFromRequest,
  createFingerprint,
  updatePaymentIntentTracking,
  
  // Verification
  verifyCheckoutSession,
} from './checkout-helper';
