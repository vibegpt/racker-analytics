/**
 * REDIS CLICK CACHE SERVICE
 * 
 * Provides fast click lookups for attribution matching.
 * Acts as a middle tier between in-memory engine and database.
 * 
 * Cache hierarchy:
 * 1. In-memory Adaptive Engine (fastest, single instance)
 * 2. Redis cache (fast, shared across instances) ← THIS SERVICE
 * 3. Database (slowest, persistent)
 */

import { Redis } from "ioredis";

// ============================================================================
// REDIS CLIENT
// ============================================================================

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (!redis && process.env.UPSTASH_REDIS_URL) {
    redis = new Redis(process.env.UPSTASH_REDIS_URL);
    console.log('[ClickCache] Redis connected');
  }
  return redis;
}

// ============================================================================
// CACHED CLICK DATA STRUCTURE
// ============================================================================

export interface CachedClick {
  // Identifiers
  clickId: string;
  linkId: string;
  userId: string;
  slug: string;
  platform: string;
  
  // Matching signals
  ipAddress?: string;
  fingerprint?: string;
  trackerId?: string;
  
  // Geo data
  country?: string;
  region?: string;
  city?: string;
  
  // Context
  referer?: string;
  utmSource?: string;
  utmCampaign?: string;
  
  // Timestamps
  clickedAt: string; // ISO string
  cachedAt: string;  // ISO string
  
  // Attribution status
  attributed: boolean;
  saleId?: string;
}

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

const CACHE_PREFIX = 'click:v2:';
const DEFAULT_TTL = 24 * 60 * 60; // 24 hours (matches attribution window)

// Index keys for different lookup strategies
const INDEX_IP = 'ip:';
const INDEX_TRACKER = 'tracker:';
const INDEX_FINGERPRINT = 'fp:';
const INDEX_USER = 'user:';

// ============================================================================
// CACHE OPERATIONS
// ============================================================================

/**
 * Cache a click for fast attribution lookup
 * Creates multiple indexes for different matching strategies
 */
export async function cacheClick(click: CachedClick): Promise<void> {
  const client = getRedis();
  if (!client) return;

  const clickJson = JSON.stringify(click);
  const ttl = DEFAULT_TTL;

  try {
    const pipeline = client.pipeline();

    // Primary key: clickId
    pipeline.setex(`${CACHE_PREFIX}id:${click.clickId}`, ttl, clickJson);

    // Index by IP (most reliable for attribution)
    if (click.ipAddress) {
      // Store as a list to handle multiple clicks from same IP
      const ipKey = `${CACHE_PREFIX}${INDEX_IP}${click.ipAddress}`;
      pipeline.lpush(ipKey, click.clickId);
      pipeline.ltrim(ipKey, 0, 99); // Keep last 100 clicks per IP
      pipeline.expire(ipKey, ttl);
    }

    // Index by tracker ID (cross-session)
    if (click.trackerId) {
      const trackerKey = `${CACHE_PREFIX}${INDEX_TRACKER}${click.trackerId}`;
      pipeline.setex(trackerKey, ttl, click.clickId);
    }

    // Index by fingerprint
    if (click.fingerprint) {
      const fpKey = `${CACHE_PREFIX}${INDEX_FINGERPRINT}${click.fingerprint}`;
      pipeline.lpush(fpKey, click.clickId);
      pipeline.ltrim(fpKey, 0, 49); // Keep last 50 clicks per fingerprint
      pipeline.expire(fpKey, ttl);
    }

    // Index by userId for dashboard queries
    const userKey = `${CACHE_PREFIX}${INDEX_USER}${click.userId}`;
    pipeline.lpush(userKey, click.clickId);
    pipeline.ltrim(userKey, 0, 199); // Keep last 200 clicks per user
    pipeline.expire(userKey, ttl);

    await pipeline.exec();
    console.log(`[ClickCache] Cached click ${click.clickId}`);

  } catch (err) {
    console.error('[ClickCache] Failed to cache click:', err);
  }
}

/**
 * Get a click by ID
 */
export async function getClickById(clickId: string): Promise<CachedClick | null> {
  const client = getRedis();
  if (!client) return null;

  try {
    const data = await client.get(`${CACHE_PREFIX}id:${clickId}`);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error('[ClickCache] Failed to get click by ID:', err);
    return null;
  }
}

/**
 * Find clicks by IP address
 * Returns most recent first
 */
export async function findClicksByIp(
  ip: string,
  options: {
    userId?: string;
    limit?: number;
    excludeAttributed?: boolean;
  } = {}
): Promise<CachedClick[]> {
  const client = getRedis();
  if (!client) return [];

  const { userId, limit = 10, excludeAttributed = true } = options;

  try {
    // Get click IDs from IP index
    const ipKey = `${CACHE_PREFIX}${INDEX_IP}${ip}`;
    const clickIds = await client.lrange(ipKey, 0, limit * 2); // Fetch extra to filter

    if (clickIds.length === 0) return [];

    // Fetch click details
    const clicks: CachedClick[] = [];
    for (const clickId of clickIds) {
      const click = await getClickById(clickId);
      if (click) {
        // Filter by userId if specified
        if (userId && click.userId !== userId) continue;
        // Filter out attributed clicks if requested
        if (excludeAttributed && click.attributed) continue;
        
        clicks.push(click);
        if (clicks.length >= limit) break;
      }
    }

    return clicks;

  } catch (err) {
    console.error('[ClickCache] Failed to find clicks by IP:', err);
    return [];
  }
}

/**
 * Find click by tracker ID
 */
export async function findClickByTracker(trackerId: string): Promise<CachedClick | null> {
  const client = getRedis();
  if (!client) return null;

  try {
    const trackerKey = `${CACHE_PREFIX}${INDEX_TRACKER}${trackerId}`;
    const clickId = await client.get(trackerKey);
    
    if (!clickId) return null;
    return getClickById(clickId);

  } catch (err) {
    console.error('[ClickCache] Failed to find click by tracker:', err);
    return null;
  }
}

/**
 * Find clicks by fingerprint
 */
export async function findClicksByFingerprint(
  fingerprint: string,
  options: {
    userId?: string;
    limit?: number;
    excludeAttributed?: boolean;
  } = {}
): Promise<CachedClick[]> {
  const client = getRedis();
  if (!client) return [];

  const { userId, limit = 10, excludeAttributed = true } = options;

  try {
    const fpKey = `${CACHE_PREFIX}${INDEX_FINGERPRINT}${fingerprint}`;
    const clickIds = await client.lrange(fpKey, 0, limit * 2);

    if (clickIds.length === 0) return [];

    const clicks: CachedClick[] = [];
    for (const clickId of clickIds) {
      const click = await getClickById(clickId);
      if (click) {
        if (userId && click.userId !== userId) continue;
        if (excludeAttributed && click.attributed) continue;
        
        clicks.push(click);
        if (clicks.length >= limit) break;
      }
    }

    return clicks;

  } catch (err) {
    console.error('[ClickCache] Failed to find clicks by fingerprint:', err);
    return [];
  }
}

/**
 * Find clicks for a user
 */
export async function findClicksByUser(
  userId: string,
  options: {
    limit?: number;
    excludeAttributed?: boolean;
  } = {}
): Promise<CachedClick[]> {
  const client = getRedis();
  if (!client) return [];

  const { limit = 50, excludeAttributed = true } = options;

  try {
    const userKey = `${CACHE_PREFIX}${INDEX_USER}${userId}`;
    const clickIds = await client.lrange(userKey, 0, limit * 2);

    if (clickIds.length === 0) return [];

    const clicks: CachedClick[] = [];
    for (const clickId of clickIds) {
      const click = await getClickById(clickId);
      if (click) {
        if (excludeAttributed && click.attributed) continue;
        clicks.push(click);
        if (clicks.length >= limit) break;
      }
    }

    return clicks;

  } catch (err) {
    console.error('[ClickCache] Failed to find clicks by user:', err);
    return [];
  }
}

/**
 * Mark a click as attributed
 */
export async function markClickAttributed(clickId: string, saleId: string): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    const click = await getClickById(clickId);
    if (!click) return;

    click.attributed = true;
    click.saleId = saleId;

    // Update the primary record
    const ttl = await client.ttl(`${CACHE_PREFIX}id:${clickId}`);
    if (ttl > 0) {
      await client.setex(`${CACHE_PREFIX}id:${clickId}`, ttl, JSON.stringify(click));
    }

    console.log(`[ClickCache] Marked click ${clickId} as attributed to sale ${saleId}`);

  } catch (err) {
    console.error('[ClickCache] Failed to mark click attributed:', err);
  }
}

/**
 * Find best matching click for a sale
 * Tries multiple strategies in order of reliability
 */
export async function findBestMatchForSale(
  userId: string,
  saleTime: Date,
  matchingData: {
    ip?: string;
    trackerId?: string;
    fingerprint?: string;
    country?: string;
    city?: string;
  }
): Promise<{ click: CachedClick; score: number; matchType: string } | null> {
  const windowMs = DEFAULT_TTL * 1000;
  const windowStart = saleTime.getTime() - windowMs;

  // Helper to check if click is in attribution window
  const isInWindow = (click: CachedClick): boolean => {
    const clickTime = new Date(click.clickedAt).getTime();
    return clickTime >= windowStart && clickTime <= saleTime.getTime();
  };

  // Strategy 1: IP match (highest confidence)
  if (matchingData.ip) {
    const ipClicks = await findClicksByIp(matchingData.ip, { userId, limit: 5 });
    for (const click of ipClicks) {
      if (isInWindow(click)) {
        return { click, score: 0.95, matchType: 'redis_ip' };
      }
    }
  }

  // Strategy 2: Tracker ID match
  if (matchingData.trackerId) {
    const trackerClick = await findClickByTracker(matchingData.trackerId);
    if (trackerClick && trackerClick.userId === userId && isInWindow(trackerClick) && !trackerClick.attributed) {
      return { click: trackerClick, score: 0.90, matchType: 'redis_tracker' };
    }
  }

  // Strategy 3: Fingerprint match
  if (matchingData.fingerprint) {
    const fpClicks = await findClicksByFingerprint(matchingData.fingerprint, { userId, limit: 5 });
    for (const click of fpClicks) {
      if (isInWindow(click)) {
        return { click, score: 0.80, matchType: 'redis_fingerprint' };
      }
    }
  }

  // Strategy 4: Geo match (weakest)
  if (matchingData.country && matchingData.city) {
    const userClicks = await findClicksByUser(userId, { limit: 20 });
    for (const click of userClicks) {
      if (isInWindow(click) && click.country === matchingData.country && click.city === matchingData.city) {
        return { click, score: 0.60, matchType: 'redis_geo' };
      }
    }
  }

  return null;
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  connected: boolean;
  totalKeys?: number;
}> {
  const client = getRedis();
  if (!client) {
    return { connected: false };
  }

  try {
    const keys = await client.keys(`${CACHE_PREFIX}*`);
    return {
      connected: true,
      totalKeys: keys.length
    };
  } catch (err) {
    return { connected: false };
  }
}
