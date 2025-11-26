import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { youtubeService } from '@/lib/services/youtube';

/**
 * YouTube OAuth Initiation Route
 * Generates authorization URL and redirects user to Google OAuth consent screen
 *
 * GET /api/auth/youtube
 * Requires: Authenticated user (Clerk)
 */
export async function GET(request: NextRequest) {
  try {
    // Get current user from Clerk
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate a state parameter for CSRF protection
    // Include user ID and timestamp
    const state = JSON.stringify({
      userId: user.id,
      timestamp: Date.now(),
    });
    const encodedState = Buffer.from(state).toString('base64');

    // Generate YouTube OAuth URL
    const authUrl = youtubeService.getAuthUrl(encodedState);

    // Redirect to Google OAuth consent screen
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('YouTube OAuth initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate YouTube authentication' },
      { status: 500 }
    );
  }
}
