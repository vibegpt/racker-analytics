/**
 * Short URL Handler
 * Redirects /[slug] to the tracking API at /api/track/[slug]
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Build the tracking API URL with all original query params
  const trackUrl = new URL(`/api/track/${slug}`, request.url);

  // Forward any query params
  request.nextUrl.searchParams.forEach((value, key) => {
    trackUrl.searchParams.set(key, value);
  });

  // Forward headers for geo detection
  const headers = new Headers();
  const forwardHeaders = [
    'x-forwarded-for',
    'x-real-ip',
    'cf-connecting-ip',
    'cf-ipcountry',
    'x-vercel-ip-country',
    'x-vercel-ip-city',
    'user-agent',
    'referer',
  ];

  forwardHeaders.forEach(h => {
    const value = request.headers.get(h);
    if (value) headers.set(h, value);
  });

  // Make internal request to tracking API
  const response = await fetch(trackUrl.toString(), {
    headers,
    redirect: 'manual',
  });

  // If tracking API returns a redirect, forward it
  if (response.status === 307 || response.status === 302) {
    const location = response.headers.get('location');
    if (location) {
      return NextResponse.redirect(location, { status: 307 });
    }
  }

  // If not found or error, return 404
  if (!response.ok) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  return response;
}
