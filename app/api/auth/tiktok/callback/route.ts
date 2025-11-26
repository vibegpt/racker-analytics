import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { encrypt } from '@/lib/encryption';
import tiktokService from '@/lib/services/tiktok';

/**
 * TikTok OAuth Callback
 * Handles the OAuth callback from TikTok
 *
 * GET /api/auth/tiktok/callback?code=xxx&state=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // This is the Clerk user ID
    const error = searchParams.get('error');

    if (error) {
      console.error('TikTok OAuth error:', error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=tiktok_auth_denied`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=missing_params`
      );
    }

    // Get code_verifier from cookie
    const codeVerifier = request.cookies.get('tiktok_code_verifier')?.value;
    if (!codeVerifier) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=missing_code_verifier`
      );
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/tiktok/callback`;

    // Exchange code for access token (with PKCE)
    const tokenData = await tiktokService.exchangeCodeForToken(code, redirectUri, codeVerifier);

    // Get TikTok user profile
    const tiktokUser = await tiktokService.getUserInfo(tokenData.access_token);

    // Find user in database by Clerk ID (state parameter)
    const user = await db.user.findUnique({
      where: { clerkId: state },
    });

    if (!user) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=user_not_found`
      );
    }

    // Encrypt tokens
    const encryptedAccessToken = encrypt(tokenData.access_token);
    const encryptedRefreshToken = encrypt(tokenData.refresh_token);

    // Calculate token expiration
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
    const refreshExpiresAt = new Date(Date.now() + tokenData.refresh_expires_in * 1000);

    // Store or update TikTok connection
    await db.platformConnection.upsert({
      where: {
        userId_platform: {
          userId: user.id,
          platform: 'tiktok',
        },
      },
      create: {
        userId: user.id,
        platform: 'tiktok',
        platformUserId: tiktokUser.open_id,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt: expiresAt,
        tiktokUsername: tiktokUser.display_name,
        tiktokFollowers: tiktokUser.follower_count || 0,
        syncStatus: 'active',
      },
      update: {
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt: expiresAt,
        tiktokUsername: tiktokUser.display_name,
        tiktokFollowers: tiktokUser.follower_count || 0,
        syncStatus: 'active',
        lastSyncedAt: null,
      },
    });

    console.log(`TikTok connected for user ${user.id}: ${tiktokUser.display_name}`);

    // Redirect back to dashboard and clear the code_verifier cookie
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=tiktok_connected`
    );
    response.cookies.delete('tiktok_code_verifier');

    return response;
  } catch (error) {
    console.error('Error in TikTok OAuth callback:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=tiktok_connection_failed`
    );
  }
}
