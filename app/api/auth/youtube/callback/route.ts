import { NextRequest, NextResponse } from 'next/server';
import { youtubeService } from '@/lib/services/youtube';
import { db } from '@/lib/db';
import { encrypt } from '@/lib/encryption';

/**
 * YouTube OAuth Callback Route
 * Handles the OAuth callback from Google, exchanges code for tokens,
 * fetches channel info, and stores in database
 *
 * GET /api/auth/youtube/callback?code=...&state=...
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Handle OAuth error (user denied access)
  if (error) {
    return NextResponse.redirect(`${appUrl}/dashboard?error=youtube_${error}`);
  }

  // Validate required parameters
  if (!code || !state) {
    return NextResponse.redirect(`${appUrl}/dashboard?error=youtube_missing_parameters`);
  }

  try {
    // Decode and validate state parameter (CSRF protection)
    const decodedState = JSON.parse(Buffer.from(state, 'base64').toString());
    const { userId, timestamp } = decodedState;

    // Check if state is recent (within 10 minutes)
    const tenMinutes = 10 * 60 * 1000;
    if (Date.now() - timestamp > tenMinutes) {
      throw new Error('State parameter expired');
    }

    // Exchange authorization code for tokens
    const tokens = await youtubeService.getTokensFromCode(code);

    if (!tokens.access_token) {
      throw new Error('No access token received from Google');
    }

    // Fetch channel info using access token
    const channelInfo = await youtubeService.getChannelInfo(tokens.access_token);

    // Find or create user in database
    let user = await db.user.findUnique({
      where: { clerkId: userId },
    });

    // Auto-create user if they don't exist yet
    if (!user) {
      user = await db.user.create({
        data: {
          clerkId: userId,
          email: channelInfo.title ? `${channelInfo.title}@youtube.temp` : `user_${userId}@temp.com`,
          name: channelInfo.title || 'YouTube User',
        },
      });
    }

    // Store or update the YouTube connection
    const expiresAt = tokens.expiry_date ? new Date(tokens.expiry_date) : null;

    await db.platformConnection.upsert({
      where: {
        userId_platform: {
          userId: user.id,
          platform: 'youtube',
        },
      },
      update: {
        platformUserId: channelInfo.id,
        accessToken: encrypt(tokens.access_token),
        refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
        tokenExpiresAt: expiresAt,
        youtubeChannelId: channelInfo.id,
        youtubeChannelName: channelInfo.title || undefined,
        youtubeSubscribers: channelInfo.subscriberCount,
        syncStatus: 'active',
        lastSyncedAt: new Date(),
      },
      create: {
        userId: user.id,
        platform: 'youtube',
        platformUserId: channelInfo.id,
        accessToken: encrypt(tokens.access_token),
        refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
        tokenExpiresAt: expiresAt,
        youtubeChannelId: channelInfo.id,
        youtubeChannelName: channelInfo.title || undefined,
        youtubeSubscribers: channelInfo.subscriberCount,
        syncStatus: 'active',
      },
    });

    // Success! Redirect to dashboard with success message
    return NextResponse.redirect(`${appUrl}/dashboard?connected=youtube&channel=${encodeURIComponent(channelInfo.title || 'YouTube')}`);
  } catch (error) {
    console.error('YouTube OAuth callback error:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.redirect(
      `${appUrl}/dashboard?error=youtube_connection_failed`
    );
  }
}
