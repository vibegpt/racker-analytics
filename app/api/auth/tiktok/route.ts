import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import crypto from 'crypto';

/**
 * TikTok OAuth Flow - Initiate
 * Redirects user to TikTok authorization page with PKCE
 *
 * GET /api/auth/tiktok
 */
export async function GET(request: NextRequest) {
  try {
    // Get current user from Clerk
    const clerkUser = await currentUser();

    if (!clerkUser) {
      const signInUrl = new URL('/sign-in', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
      return NextResponse.redirect(signInUrl);
    }

    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/tiktok/callback`;

    if (!clientKey) {
      return NextResponse.json(
        { error: 'TikTok app not configured' },
        { status: 500 }
      );
    }

    // Generate PKCE code_verifier (random string, 43-128 characters)
    const codeVerifier = crypto.randomBytes(32).toString('base64url');

    // Generate code_challenge (SHA256 hash of code_verifier, base64url encoded)
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    // Generate CSRF token (use Clerk user ID)
    const csrfState = clerkUser.id;

    // Build TikTok OAuth URL with PKCE
    const authUrl = new URL('https://www.tiktok.com/v2/auth/authorize/');
    authUrl.searchParams.append('client_key', clientKey);
    authUrl.searchParams.append('scope', 'user.info.basic,video.list');
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('state', csrfState);
    authUrl.searchParams.append('code_challenge', codeChallenge);
    authUrl.searchParams.append('code_challenge_method', 'S256');

    // Store code_verifier in cookie to use in callback
    const response = NextResponse.redirect(authUrl.toString());
    response.cookies.set('tiktok_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error initiating TikTok OAuth:', error);
    return NextResponse.json({ error: 'OAuth initiation failed' }, { status: 500 });
  }
}
