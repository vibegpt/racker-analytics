/**
 * SLUG GENERATOR
 * 
 * Generates unique, short slugs for smart links.
 * Uses a combination of random characters for short, memorable slugs.
 */

import { db } from "@/lib/db";

// Characters to use in slugs (no ambiguous chars like 0/O, 1/l/I)
const SLUG_CHARS = "abcdefghjkmnpqrstuvwxyz23456789";
const DEFAULT_SLUG_LENGTH = 6;

/**
 * Generate a random slug
 */
function generateRandomSlug(length: number = DEFAULT_SLUG_LENGTH): string {
  let slug = "";
  for (let i = 0; i < length; i++) {
    slug += SLUG_CHARS[Math.floor(Math.random() * SLUG_CHARS.length)];
  }
  return slug;
}

/**
 * Check if a slug is available
 */
export async function isSlugAvailable(slug: string): Promise<boolean> {
  const existing = await db.smartLink.findUnique({
    where: { slug: slug.toLowerCase() },
    select: { id: true },
  });
  return !existing;
}

/**
 * Generate a unique slug
 * Retries with longer slugs if collisions occur
 */
export async function generateSlug(
  maxAttempts: number = 10
): Promise<string> {
  let length = DEFAULT_SLUG_LENGTH;
  let attempts = 0;

  while (attempts < maxAttempts) {
    const slug = generateRandomSlug(length);
    const available = await isSlugAvailable(slug);

    if (available) {
      return slug;
    }

    attempts++;
    
    // Increase length every 3 attempts to reduce collision chance
    if (attempts % 3 === 0) {
      length++;
    }
  }

  // Final fallback: use timestamp + random
  const timestamp = Date.now().toString(36);
  const random = generateRandomSlug(4);
  return `${timestamp}${random}`;
}

/**
 * Generate a slug with a prefix (e.g., platform-based)
 */
export async function generatePrefixedSlug(
  prefix: string,
  maxAttempts: number = 10
): Promise<string> {
  let attempts = 0;
  const normalizedPrefix = prefix.toLowerCase().slice(0, 3);

  while (attempts < maxAttempts) {
    const random = generateRandomSlug(4);
    const slug = `${normalizedPrefix}-${random}`;
    const available = await isSlugAvailable(slug);

    if (available) {
      return slug;
    }

    attempts++;
  }

  // Fallback
  const timestamp = Date.now().toString(36).slice(-4);
  return `${normalizedPrefix}-${timestamp}`;
}

/**
 * Validate a custom slug
 */
export function validateSlug(slug: string): { valid: boolean; error?: string } {
  if (!slug) {
    return { valid: false, error: "Slug is required" };
  }

  if (slug.length < 3) {
    return { valid: false, error: "Slug must be at least 3 characters" };
  }

  if (slug.length > 50) {
    return { valid: false, error: "Slug must be 50 characters or less" };
  }

  if (!/^[a-zA-Z0-9-_]+$/.test(slug)) {
    return { 
      valid: false, 
      error: "Slug can only contain letters, numbers, hyphens, and underscores" 
    };
  }

  // Reserved slugs
  const reserved = ["api", "app", "admin", "dashboard", "login", "signup", "auth", "track"];
  if (reserved.includes(slug.toLowerCase())) {
    return { valid: false, error: "This slug is reserved" };
  }

  return { valid: true };
}
