/**
 * SMART LINK TRACK API - With Geo Routing & Insights Learning
 */

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Platform } from "@prisma/client";
import { Redis } from "ioredis";
import { headers, cookies } from "next/headers";
import { resolveGeoRoute, GeoRouterConfig } from "@/lib/routing/geo-router";
import { getInsightsEngine } from "@/lib/insights";

const prisma = new PrismaClient();

const redis = process.env.UPSTASH_REDIS_URL
  ? new Redis(process.env.UPSTASH_REDIS_URL)
  : null;

const TRACKER_COOKIE = 'rckr_id';
const TRACKER_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

interface SmartLinkData {
  id: string;
  userId: string;
  slug: string;
  originalUrl: string;
  platform: string;
  active: boolean;
  routerType: string;
  routerConfig: any;
}

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
  clickedAt: Date;
}

interface RouteResult {
  url: string;
  routeMatch: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const startTime = Date.now();
  const { slug } = await params;

  try {
    const link = await findSmartLink(slug);
    if (!link || !link.active) {
      return new NextResponse("Link not found", { status: 404 });
    }

    const cookieStore = await cookies();
    let trackerId = cookieStore.get(TRACKER_COOKIE)?.value;
    const isNewTracker = !trackerId;
    
    if (!trackerId) {
      trackerId = generateTrackerId();
    }

    const clickMetadata = await extractClickMetadata(request, trackerId);
    const routeResult = resolveDestination(link, clickMetadata);

    logClick(link, clickMetadata, routeResult).catch(err => {
      console.error('[Track] Failed to log click:', err);
    });

    const redirectTime = Date.now() - startTime;
    console.log(\`[Track] \${slug} -> \${routeResult.routeMatch} in \${redirectTime}ms\`);

    const response = NextResponse.redirect(routeResult.url, { status: 307 });

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

function resolveDestination(link: SmartLinkData, metadata: ClickMetadata): RouteResult {
  if (link.routerType === 'GEO_AFFILIATE' && link.routerConfig) {
    const config = link.routerConfig as GeoRouterConfig;
    const result = resolveGeoRoute(config, metadata.country, metadata.region);
    
    return {
      url: result.url,
      routeMatch: result.matchType === 'default' 
        ? 'default' 
        : \`country:\${result.matchedCountry}\${result.matchedRegion ? \`:\${result.matchedRegion}\` : ''}\`
    };
  }

  return {
    url: link.originalUrl,
    routeMatch: 'standard'
  };
}

async function findSmartLink(slug: string): Promise<SmartLinkData | null> {
  if (redis) {
    const cached = await redis.get(\`link:\${slug}\`);
    if (cached) {
      return JSON.parse(cached);
    }
  }

  const link = await prisma.smartLink.findUnique({
    where: { slug },
    select: {
      id: true,
      userId: true,
      slug: true,
      originalUrl: true,
      platform: true,
      active: true,
      routerType: true,
      routerConfig: true
    }
  });

  if (!link) return null;

  if (redis) {
    await redis.setex(\`link:\${slug}\`, 3600, JSON.stringify(link));
  }

  return link;
}

async function extractClickMetadata(
  request: NextRequest,
  trackerId: string
): Promise<ClickMetadata> {
  const headersList = await headers();
  
  const ipAddress = 
    headersList.get('x-forwarded-for')?.split(',')[0] ||
    headersList.get('x-real-ip') ||
    headersList.get('cf-connecting-ip') ||
    'unknown';

  const userAgent = headersList.get('user-agent') || 'unknown';
  const referer = headersList.get('referer') || 'direct';

  const country = headersList.get('x-vercel-ip-country') || undefined;
  const region = headersList.get('x-vercel-ip-country-region') || undefined;
  const city = headersList.get('x-vercel-ip-city') || undefined;
  const latitude = parseFloat(headersList.get('x-vercel-ip-latitude') || '0') || undefined;
  const longitude = parseFloat(headersList.get('x-vercel-ip-longitude') || '0') || undefined;

  const url = new URL(request.url);

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
    deviceType: getDeviceType(userAgent),
    browser: getBrowser(userAgent),
    os: getOS(userAgent),
    utmSource: url.searchParams.get('utm_source') || undefined,
    utmMedium: url.searchParams.get('utm_medium') || undefined,
    utmCampaign: url.searchParams.get('utm_campaign') || undefined,
    utmTerm: url.searchParams.get('utm_term') || undefined,
    utmContent: url.searchParams.get('utm_content') || undefined,
    clickedAt: new Date()
  };
}

async function logClick(
  link: SmartLinkData,
  metadata: ClickMetadata,
  routeResult: RouteResult
): Promise<string> {
  const click = await prisma.click.create({
    data: {
      linkId: link.id,
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
      utmContent: metadata.utmContent,
      routedTo: routeResult.url,
      routeMatch: routeResult.routeMatch
    }
  });

  // Record click in insights engine for learning
  try {
    const creatorProfile = await prisma.creatorProfile.findUnique({
      where: { userId: link.userId },
      select: { niche: true, country: true }
    });

    const engine = getInsightsEngine();
    engine.recordClick({
      linkId: link.id,
      platform: link.platform as Platform,
      creatorNiche: creatorProfile?.niche,
      creatorCountry: creatorProfile?.country || undefined,
      clickedAt: metadata.clickedAt,
      visitorCountry: metadata.country,
      visitorRegion: metadata.region,
      deviceType: metadata.deviceType as 'mobile' | 'desktop' | 'tablet' | undefined,
    });
  } catch (insightError) {
    // Don't fail the click if insights recording fails
    console.error('[Track] Insights recording failed:', insightError);
  }

  return click.id;
}

function generateTrackerId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return \`rckr_\${timestamp}_\${random}\`;
}

function getDeviceType(ua: string): string {
  const lower = ua.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(lower)) return 'tablet';
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile/.test(ua)) return 'mobile';
  return 'desktop';
}

function getBrowser(ua: string): string {
  const lower = ua.toLowerCase();
  if (lower.includes('firefox')) return 'Firefox';
  if (lower.includes('edg')) return 'Edge';
  if (lower.includes('chrome')) return 'Chrome';
  if (lower.includes('safari')) return 'Safari';
  return 'Unknown';
}

function getOS(ua: string): string {
  const lower = ua.toLowerCase();
  if (lower.includes('win')) return 'Windows';
  if (lower.includes('mac')) return 'macOS';
  if (lower.includes('linux')) return 'Linux';
  if (lower.includes('android')) return 'Android';
  if (lower.includes('iphone') || lower.includes('ipad')) return 'iOS';
  return 'Unknown';
}

export async function invalidateLinkCache(slug: string): Promise<void> {
  if (redis) {
    await redis.del(\`link:\${slug}\`);
  }
}
