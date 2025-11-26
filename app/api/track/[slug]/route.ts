/**
 * SMART LINK TRACK API - Production Implementation
 * 
 * This API endpoint:
 * 1. Captures click metadata (IP, geo, device, UTM)
 * 2. Sets a tracking cookie for cross-session attribution
 * 3. Logs to database via Prisma
 * 4. Caches link data in Redis for <100ms response
 * 5. Redirects to destination URL
 */

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { Redis } from "ioredis";
import { headers, cookies } from "next/headers";
import { getAdaptiveEngine } from "@/lib/attribution/attribution-service";
import { ClickEvent } from "@/lib/correlation/adaptive-engine";
import { cacheClick, CachedClick } from "@/lib/cache/click-cache";

const prisma = new PrismaClient();

// Redis for fast lookups (optional but recommended)
const redis = process.env.UPSTASH_REDIS_URL 
  ? new Redis(process.env.UPSTASH_REDIS_URL)
  : null;

// Cookie name for cross-session tracking
const TRACKER_COOKIE = 'rckr_id';
const TRACKER_COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

// ============================================================================
// MAIN TRACK ENDPOINT
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const startTime = Date.now();
  const { slug } = await params;

  try {
    // 1. Find the smart link (Redis → Database)
    const link = await findSmartLink(slug);

    if (!link || !link.active) {
      return new NextResponse("Link not found or inactive", { status: 404 });
    }

    // 2. Get or create tracker ID (for cross-session attribution)
    const cookieStore = await cookies();
    let trackerId = cookieStore.get(TRACKER_COOKIE)?.value;
    const isNewTracker = !trackerId;
    
    if (!trackerId) {
      trackerId = generateTrackerId();
    }

    // 3. Extract metadata (parallel to redirect for speed)
    const clickMetadata = await extractClickMetadata(request, trackerId);

    // 4. Log the click to database (fire and forget)
    const clickIdPromise = logClick(link.id, clickMetadata).catch(err => {
      console.error('[Track] Failed to log click:', err);
      return null;
    });

    // 5. Cache the click in Redis for fast attribution lookup (new v2 cache)
    clickIdPromise.then(clickId => {
      if (clickId) {
        cacheClickForAttributionV2(clickId, link, clickMetadata);
      }
    }).catch(err => {
      console.error('[Track] Failed to cache click:', err);
    });

    // 6. Feed click to Adaptive Engine for real-time tracking
    clickIdPromise.then(clickId => {
      if (clickId) {
        feedClickToAdaptiveEngine(clickId, link, clickMetadata);
      }
    }).catch(err => {
      console.error('[Track] Failed to feed click to engine:', err);
    });

    // 7. Build redirect response with tracking cookie
    const redirectTime = Date.now() - startTime;
    console.log(`[Track] Redirected ${slug} in ${redirectTime}ms`);

    const response = NextResponse.redirect(link.originalUrl, {
      status: 307 // Temporary redirect (preserves POST method if needed)
    });

    // Set tracking cookie if new
    if (isNewTracker) {
      response.cookies.set(TRACKER_COOKIE, trackerId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: TRACKER_COOKIE_MAX_AGE,
        path: '/'
      });
    }

    return response;

  } catch (error) {
    console.error('[Track] Error:', error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// ============================================================================
// SMART LINK LOOKUP (with Redis caching)
// ============================================================================

interface SmartLinkData {
  id: string;
  userId: string;
  slug: string;
  originalUrl: string;
  platform: string;
  active: boolean;
}

async function findSmartLink(slug: string): Promise<SmartLinkData | null> {
  // Try Redis cache first (1-2ms lookup)
  if (redis) {
    const cached = await redis.get(`link:${slug}`);
    if (cached) {
      console.log(`[Track] Cache HIT: ${slug}`);
      return JSON.parse(cached);
    }
  }

  // Cache miss - query database
  const link = await prisma.smartLink.findUnique({
    where: { slug },
    select: {
      id: true,
      userId: true,
      slug: true,
      originalUrl: true,
      platform: true,
      active: true
    }
  });

  if (!link) return null;

  // Cache for 1 hour
  if (redis) {
    await redis.setex(
      `link:${slug}`,
      3600,
      JSON.stringify(link)
    );
  }

  return link;
}

// ============================================================================
// CLICK METADATA EXTRACTION
// ============================================================================

interface ClickMetadata {
  trackerId: string;
  ipAddress: string;
  userAgent: string;
  referer: string;
  country?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  deviceType?: string;
  browser?: string;
  os?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  fingerprint?: string;
  clickedAt: Date;
}

async function extractClickMetadata(
  request: NextRequest,
  trackerId: string
): Promise<ClickMetadata> {
  const headersList = await headers();
  
  // IP Address (check various headers for proxied requests)
  const ipAddress = 
    headersList.get('x-forwarded-for')?.split(',')[0] ||
    headersList.get('x-real-ip') ||
    headersList.get('cf-connecting-ip') || // Cloudflare
    'unknown';

  // User Agent
  const userAgent = headersList.get('user-agent') || 'unknown';

  // Referer
  const referer = headersList.get('referer') || 'direct';

  // Device detection (simple heuristics)
  const deviceType = getDeviceType(userAgent);
  const browser = getBrowser(userAgent);
  const os = getOS(userAgent);

  // Geo location (if using a service like Vercel's geo headers)
  const country = headersList.get('x-vercel-ip-country') || undefined;
  const region = headersList.get('x-vercel-ip-country-region') || undefined;
  const city = headersList.get('x-vercel-ip-city') || undefined;
  const latitude = parseFloat(headersList.get('x-vercel-ip-latitude') || '0') || undefined;
  const longitude = parseFloat(headersList.get('x-vercel-ip-longitude') || '0') || undefined;

  // UTM parameters
  const url = new URL(request.url);
  const utmSource = url.searchParams.get('utm_source') || undefined;
  const utmMedium = url.searchParams.get('utm_medium') || undefined;
  const utmCampaign = url.searchParams.get('utm_campaign') || undefined;
  const utmTerm = url.searchParams.get('utm_term') || undefined;
  const utmContent = url.searchParams.get('utm_content') || undefined;

  // Create a simple fingerprint for attribution matching
  const fingerprint = createFingerprint(ipAddress, userAgent, country);

  return {
    trackerId,
    ipAddress,
    userAgent,
    referer,
    country,
    region,
    city,
    latitude,
    longitude,
    deviceType,
    browser,
    os,
    utmSource,
    utmMedium,
    utmCampaign,
    utmTerm,
    utmContent,
    fingerprint,
    clickedAt: new Date()
  };
}

// ============================================================================
// CLICK LOGGING (to Database)
// ============================================================================

async function logClick(linkId: string, metadata: ClickMetadata): Promise<string> {
  const click = await prisma.click.create({
    data: {
      linkId: linkId,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      referer: metadata.referer,
      country: metadata.country,
      region: metadata.region,
      city: metadata.city,
      latitude: metadata.latitude,
      longitude: metadata.longitude,
      deviceType: metadata.deviceType,
      browser: metadata.browser,
      os: metadata.os,
      utmSource: metadata.utmSource,
      utmMedium: metadata.utmMedium,
      utmCampaign: metadata.utmCampaign,
      utmTerm: metadata.utmTerm,
      utmContent: metadata.utmContent
    }
  });

  console.log(`[Track] Logged click ${click.id} for link ${linkId}`);
  return click.id;
}

// ============================================================================
// ADAPTIVE ENGINE INTEGRATION
// ============================================================================

/**
 * Feed click event to the Adaptive Engine for real-time tracking
 * This warms up the engine before sales arrive
 */
function feedClickToAdaptiveEngine(
  clickId: string,
  link: SmartLinkData,
  metadata: ClickMetadata
): void {
  try {
    const engine = getAdaptiveEngine();
    
    const clickEvent: ClickEvent = {
      id: clickId,
      linkId: link.id,
      userId: link.userId,
      slug: link.slug,
      platform: link.platform.toLowerCase(),
      
      // Matching signals
      ipAddress: metadata.ipAddress !== 'unknown' ? metadata.ipAddress : undefined,
      fingerprint: metadata.fingerprint,
      trackerId: metadata.trackerId,
      
      // Geo data
      country: metadata.country,
      region: metadata.region,
      city: metadata.city,
      
      // Context
      referer: metadata.referer !== 'direct' ? metadata.referer : undefined,
      utmSource: metadata.utmSource,
      utmCampaign: metadata.utmCampaign,
      
      clickedAt: metadata.clickedAt,
      
      // Not yet attributed
      attributed: false
    };
    
    engine.recordClick(clickEvent);
    
  } catch (err) {
    console.error('[Track] Failed to record click in Adaptive Engine:', err);
  }
}

// ============================================================================
// REDIS CACHING V2 - Enhanced for Attribution
// ============================================================================

/**
 * Cache click data using the new click-cache service
 * Stores full click data with multiple indexes
 */
async function cacheClickForAttributionV2(
  clickId: string,
  link: SmartLinkData,
  metadata: ClickMetadata
): Promise<void> {
  const cachedClick: CachedClick = {
    clickId,
    linkId: link.id,
    userId: link.userId,
    slug: link.slug,
    platform: link.platform.toLowerCase(),
    
    ipAddress: metadata.ipAddress !== 'unknown' ? metadata.ipAddress : undefined,
    fingerprint: metadata.fingerprint,
    trackerId: metadata.trackerId,
    
    country: metadata.country,
    region: metadata.region,
    city: metadata.city,
    
    referer: metadata.referer !== 'direct' ? metadata.referer : undefined,
    utmSource: metadata.utmSource,
    utmCampaign: metadata.utmCampaign,
    
    clickedAt: metadata.clickedAt.toISOString(),
    cachedAt: new Date().toISOString(),
    
    attributed: false
  };
  
  await cacheClick(cachedClick);
}

// ============================================================================
// LEGACY REDIS CACHING (kept for backwards compatibility)
// ============================================================================

/**
 * Cache click data in Redis for fast lookup during attribution
 * Uses multiple keys for different matching strategies
 */
async function cacheClickForAttribution(metadata: ClickMetadata): Promise<void> {
  if (!redis) return;

  const clickData = {
    trackerId: metadata.trackerId,
    ipAddress: metadata.ipAddress,
    country: metadata.country,
    city: metadata.city,
    fingerprint: metadata.fingerprint,
    clickedAt: metadata.clickedAt.toISOString()
  };

  const ttl = 24 * 60 * 60; // 24 hours (same as attribution window)

  // Index by IP (primary matching)
  if (metadata.ipAddress !== 'unknown') {
    await redis.setex(
      `click:ip:${metadata.ipAddress}`,
      ttl,
      JSON.stringify(clickData)
    );
  }

  // Index by tracker ID (for cross-session)
  await redis.setex(
    `click:tracker:${metadata.trackerId}`,
    ttl,
    JSON.stringify(clickData)
  );

  // Index by fingerprint (fallback)
  if (metadata.fingerprint) {
    await redis.setex(
      `click:fp:${metadata.fingerprint}`,
      ttl,
      JSON.stringify(clickData)
    );
  }
}

/**
 * Look up recent click by IP (called from attribution service)
 */
export async function findRecentClickByIp(ip: string): Promise<any | null> {
  if (!redis) return null;
  
  const cached = await redis.get(`click:ip:${ip}`);
  return cached ? JSON.parse(cached) : null;
}

/**
 * Look up recent click by tracker ID
 */
export async function findRecentClickByTracker(trackerId: string): Promise<any | null> {
  if (!redis) return null;
  
  const cached = await redis.get(`click:tracker:${trackerId}`);
  return cached ? JSON.parse(cached) : null;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateTrackerId(): string {
  // Generate a unique tracker ID (UUID-like)
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `rckr_${timestamp}_${randomPart}`;
}

function createFingerprint(ip: string, userAgent: string, country?: string): string {
  // Simple fingerprint for fallback matching
  const data = `${ip}|${userAgent.substring(0, 50)}|${country || 'XX'}`;
  // Simple hash (in production, use a proper hash function)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

function getDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

function getBrowser(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('firefox')) return 'Firefox';
  if (ua.includes('chrome')) return 'Chrome';
  if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
  if (ua.includes('edge')) return 'Edge';
  if (ua.includes('opera') || ua.includes('opr')) return 'Opera';
  
  return 'Unknown';
}

function getOS(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('win')) return 'Windows';
  if (ua.includes('mac')) return 'macOS';
  if (ua.includes('linux')) return 'Linux';
  if (ua.includes('android')) return 'Android';
  if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) return 'iOS';
  
  return 'Unknown';
}

// ============================================================================
// CACHE INVALIDATION (called when link is updated)
// ============================================================================

export async function invalidateLinkCache(slug: string): Promise<void> {
  if (redis) {
    await redis.del(`link:${slug}`);
    console.log(`[Cache] Invalidated: ${slug}`);
  }
}
