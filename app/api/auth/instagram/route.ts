import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';

/**
 * Instagram OAuth Flow - Initiate
 * Redirects user to Instagram authorization page
 *
 * GET /api/auth/instagram
 */
export async function GET(request: NextRequest) {
  try {
    // Get current user from Clerk
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.redirect('/sign-in');
    }

    const clientId = process.env.INSTAGRAM_CLIENT_ID || process.env.FACEBOOK_APP_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/instagram/callback`;

    if (!clientId) {
      return NextResponse.json(
        { error: 'Instagram/Facebook app not configured' },
        { status: 500 }
      );
    }

    // Build Instagram OAuth URL
    const authUrl = new URL('https://api.instagram.com/oauth/authorize');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('scope', 'user_profile,user_media');
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('state', clerkUser.id); // Use Clerk ID as state

    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error('Error initiating Instagram OAuth:', error);
    return NextResponse.json({ error: 'OAuth initiation failed' }, { status: 500 });
  }
}
