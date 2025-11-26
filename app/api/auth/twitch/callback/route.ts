import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { encrypt } from '@/lib/encryption';
import twitchService from '@/lib/services/twitch';

/**
 * Twitch OAuth Callback
 * Handles the OAuth callback from Twitch
 *
 * GET /api/auth/twitch/callback?code=xxx&state=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // This is the Clerk user ID

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=missing_params`);
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/twitch/callback`;

    // Exchange code for access token
    const tokenData = await twitchService.exchangeCodeForToken(code, redirectUri);

    // Get Twitch user profile
    const twitchUser = await twitchService.getUser(tokenData.access_token);

    // Get follower count
    const followerCount = await twitchService.getFollowerCount(
      tokenData.access_token,
      twitchUser.id
    );

    // Find user in database by Clerk ID (state parameter)
    const user = await db.user.findUnique({
      where: { clerkId: state },
    });

    if (!user) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=user_not_found`);
    }

    // Encrypt tokens
    const encryptedAccessToken = encrypt(tokenData.access_token);
    const encryptedRefreshToken = encrypt(tokenData.refresh_token);

    // Calculate token expiration
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    // Store or update Twitch connection
    await db.platformConnection.upsert({
      where: {
        userId_platform: {
          userId: user.id,
          platform: 'twitch',
        },
      },
      create: {
        userId: user.id,
        platform: 'twitch',
        platformUserId: twitchUser.id,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt: expiresAt,
        tiktokUsername: twitchUser.login, // Re-using field
        tiktokFollowers: followerCount, // Re-using field
        syncStatus: 'active',
      },
      update: {
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt: expiresAt,
        tiktokUsername: twitchUser.login,
        tiktokFollowers: followerCount,
        syncStatus: 'active',
        lastSyncedAt: null,
      },
    });

    console.log(`Twitch connected for user ${user.id}: ${twitchUser.display_name}`);

    // Redirect back to dashboard
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=twitch_connected`
    );
  } catch (error) {
    console.error('Error in Twitch OAuth callback:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=twitch_connection_failed`
    );
  }
}
