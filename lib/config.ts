/**
 * App Configuration
 *
 * Centralizes configurable values, especially for white-labeling/testing.
 */

// Short domain for links (e.g., "rackr.co" or your custom domain "fpsyd.com")
export const SHORT_DOMAIN = process.env.NEXT_PUBLIC_SHORT_DOMAIN || "rackr.co";

// Full app URL
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://rackr.co";

// Tracking API base URL
export const TRACKING_API = process.env.NEXT_PUBLIC_TRACKING_API || "https://rackr.co/api/t";
