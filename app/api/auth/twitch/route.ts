import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';

/**
 * Twitch OAuth Flow - Initiate
 * Redirects user to Twitch authorization page
 *
 * GET /api/auth/twitch
 */
export async function GET(request: NextRequest) {
  try {
    // Get current user from Clerk
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.redirect('/sign-in');
    }

    const clientId = process.env.TWITCH_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/twitch/callback`;

    if (!clientId) {
      return NextResponse.json(
        { error: 'Twitch app not configured' },
        { status: 500 }
      );
    }

    // Build Twitch OAuth URL
    const authUrl = new URL('https://id.twitch.tv/oauth2/authorize');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', 'user:read:email channel:read:stream_key');
    authUrl.searchParams.append('state', clerkUser.id); // Use Clerk ID as state

    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error('Error initiating Twitch OAuth:', error);
    return NextResponse.json({ error: 'OAuth initiation failed' }, { status: 500 });
  }
}
