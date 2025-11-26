import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

/**
 * TikTok Disconnect
 * Removes TikTok platform connection for the authenticated user
 *
 * POST /api/auth/tiktok/disconnect
 */
export async function POST(request: NextRequest) {
  try {
    // Get current user from Clerk
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find user in database
    const user = await db.user.findUnique({
      where: { clerkId: clerkUser.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete TikTok connection
    await db.platformConnection.deleteMany({
      where: {
        userId: user.id,
        platform: 'tiktok',
      },
    });

    console.log(`TikTok disconnected for user ${user.id}`);

    return NextResponse.json({
      success: true,
      message: 'TikTok account disconnected successfully',
    });
  } catch (error) {
    console.error('Error disconnecting TikTok:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect TikTok account' },
      { status: 500 }
    );
  }
}
