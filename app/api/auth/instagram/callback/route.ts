import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { encrypt } from '@/lib/encryption';
import instagramService from '@/lib/services/instagram';

/**
 * Instagram OAuth Callback
 * Handles the OAuth callback from Instagram
 *
 * GET /api/auth/instagram/callback?code=xxx&state=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // This is the Clerk user ID

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=missing_params`);
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/instagram/callback`;

    // Exchange code for access token
    const { accessToken, userId: instagramUserId } = await instagramService.exchangeCodeForToken(
      code,
      redirectUri
    );

    // Get Instagram profile
    const profile = await instagramService.getProfile(accessToken, instagramUserId);

    // Find user in database by Clerk ID (state parameter)
    const user = await db.user.findUnique({
      where: { clerkId: state },
    });

    if (!user) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=user_not_found`);
    }

    // Encrypt access token
    const encryptedToken = encrypt(accessToken);

    // Store or update Instagram connection
    await db.platformConnection.upsert({
      where: {
        userId_platform: {
          userId: user.id,
          platform: 'instagram',
        },
      },
      create: {
        userId: user.id,
        platform: 'instagram',
        platformUserId: instagramUserId,
        accessToken: encryptedToken,
        instagramBusinessId: instagramUserId,
        instagramUsername: profile.username,
        instagramFollowers: profile.followers_count,
        syncStatus: 'active',
      },
      update: {
        accessToken: encryptedToken,
        instagramBusinessId: instagramUserId,
        instagramUsername: profile.username,
        instagramFollowers: profile.followers_count,
        syncStatus: 'active',
        lastSyncedAt: null, // Reset last synced
      },
    });

    console.log(`Instagram connected for user ${user.id}: @${profile.username}`);

    // Redirect back to dashboard
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=instagram_connected`
    );
  } catch (error) {
    console.error('Error in Instagram OAuth callback:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=instagram_connection_failed`
    );
  }
}
