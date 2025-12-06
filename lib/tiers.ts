/**
 * SUBSCRIPTION TIER LIMITS & PRICING
 *
 * Based on multi-model consensus analysis:
 * - $15/mo mid-tier for accessibility
 * - Feature gates drive upgrades (conversions on paid only)
 * - Usage-based overages instead of rev-share
 */

import { SubscriptionTier } from "@prisma/client";

export interface TierLimits {
  // Product & Link limits
  maxProducts: number;
  maxLinksPerMonth: number;

  // Feature access
  conversionTracking: boolean;
  perPostAttribution: boolean;
  apiAccess: boolean;

  // Data retention (days)
  dataRetentionDays: number;

  // Domain features
  customSubdomain: boolean;
  customVanityDomain: boolean;

  // Support
  supportLevel: "community" | "email" | "priority";

  // Overage pricing (cents per 1k clicks)
  overagePriceCents: number | null;
}

export interface TierPricing {
  monthlyPriceCents: number;
  annualPriceCents: number; // 20% discount
  stripePriceIdMonthly: string | null;
  stripePriceIdAnnual: string | null;
}

export interface TierConfig {
  name: string;
  displayName: string;
  description: string;
  limits: TierLimits;
  pricing: TierPricing;
  features: string[];
  highlighted?: boolean;
}

export const TIER_CONFIG: Record<SubscriptionTier, TierConfig> = {
  HUSTLER: {
    name: "HUSTLER",
    displayName: "Hustler",
    description: "Perfect for getting started",
    limits: {
      maxProducts: 3,
      maxLinksPerMonth: 25,
      conversionTracking: false, // 14-day trial available
      perPostAttribution: false,
      apiAccess: false,
      dataRetentionDays: 30,
      customSubdomain: false,
      customVanityDomain: false,
      supportLevel: "community",
      overagePriceCents: null, // No overages - hard cap
    },
    pricing: {
      monthlyPriceCents: 0,
      annualPriceCents: 0,
      stripePriceIdMonthly: null,
      stripePriceIdAnnual: null,
    },
    features: [
      "3 products",
      "25 links/month",
      "Basic click tracking",
      "30-day data retention",
      "Community support",
    ],
  },

  CREATOR: {
    name: "CREATOR",
    displayName: "Creator",
    description: "For growing creators",
    highlighted: true,
    limits: {
      maxProducts: 25,
      maxLinksPerMonth: 500,
      conversionTracking: true,
      perPostAttribution: true,
      apiAccess: false,
      dataRetentionDays: 365, // 1 year
      customSubdomain: true,
      customVanityDomain: false,
      supportLevel: "email",
      overagePriceCents: 500, // $5 per 1k extra clicks
    },
    pricing: {
      monthlyPriceCents: 1500, // $15/mo
      annualPriceCents: 14400, // $144/yr (20% off)
      stripePriceIdMonthly: process.env.STRIPE_PRICE_CREATOR_MONTHLY || null,
      stripePriceIdAnnual: process.env.STRIPE_PRICE_CREATOR_ANNUAL || null,
    },
    features: [
      "25 products",
      "500 links/month",
      "Full click tracking (geo/device)",
      "Conversion tracking",
      "Per-post attribution",
      "1-year data retention",
      "Custom subdomain",
      "Email support (24h)",
      "$5/1k extra clicks",
    ],
  },

  EMPIRE: {
    name: "EMPIRE",
    displayName: "Pro",
    description: "For full-time creators & agencies",
    limits: {
      maxProducts: -1, // Unlimited
      maxLinksPerMonth: -1, // Unlimited (fair use)
      conversionTracking: true,
      perPostAttribution: true,
      apiAccess: true,
      dataRetentionDays: 1095, // 3 years
      customSubdomain: true,
      customVanityDomain: true,
      supportLevel: "priority",
      overagePriceCents: null, // No overages - unlimited
    },
    pricing: {
      monthlyPriceCents: 4900, // $49/mo
      annualPriceCents: 47040, // $470.40/yr (20% off)
      stripePriceIdMonthly: process.env.STRIPE_PRICE_EMPIRE_MONTHLY || null,
      stripePriceIdAnnual: process.env.STRIPE_PRICE_EMPIRE_ANNUAL || null,
    },
    features: [
      "Unlimited products",
      "Unlimited links",
      "Full click tracking + API",
      "Conversion tracking",
      "Per-post attribution",
      "3-year data retention",
      "Custom vanity domain",
      "Priority support (2h SLA)",
      "Webhooks & integrations",
    ],
  },
};

/**
 * Get tier config for a user's subscription tier
 */
export function getTierConfig(tier: SubscriptionTier): TierConfig {
  return TIER_CONFIG[tier];
}

/**
 * Get tier limits for a user's subscription tier
 */
export function getTierLimits(tier: SubscriptionTier): TierLimits {
  return TIER_CONFIG[tier].limits;
}

/**
 * Check if a limit is unlimited (-1)
 */
export function isUnlimited(limit: number): boolean {
  return limit === -1;
}

/**
 * Check if user can create more products
 */
export function canCreateProduct(tier: SubscriptionTier, currentCount: number): boolean {
  const limits = getTierLimits(tier);
  return isUnlimited(limits.maxProducts) || currentCount < limits.maxProducts;
}

/**
 * Check if user can create more links this month
 */
export function canCreateLink(tier: SubscriptionTier, currentMonthCount: number): boolean {
  const limits = getTierLimits(tier);
  return isUnlimited(limits.maxLinksPerMonth) || currentMonthCount < limits.maxLinksPerMonth;
}

/**
 * Get remaining products allowed
 */
export function getRemainingProducts(tier: SubscriptionTier, currentCount: number): number | "unlimited" {
  const limits = getTierLimits(tier);
  if (isUnlimited(limits.maxProducts)) return "unlimited";
  return Math.max(0, limits.maxProducts - currentCount);
}

/**
 * Get remaining links allowed this month
 */
export function getRemainingLinks(tier: SubscriptionTier, currentMonthCount: number): number | "unlimited" {
  const limits = getTierLimits(tier);
  if (isUnlimited(limits.maxLinksPerMonth)) return "unlimited";
  return Math.max(0, limits.maxLinksPerMonth - currentMonthCount);
}

/**
 * Calculate overage cost for extra clicks
 */
export function calculateOverageCost(tier: SubscriptionTier, extraClicks: number): number {
  const limits = getTierLimits(tier);
  if (!limits.overagePriceCents) return 0;
  return Math.ceil(extraClicks / 1000) * limits.overagePriceCents;
}
