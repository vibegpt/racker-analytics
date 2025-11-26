import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

/**
 * YouTube Disconnect Route
 * Removes YouTube connection and deletes stored OAuth tokens
 *
 * POST /api/auth/youtube/disconnect
 * Requires: Authenticated user (Clerk)
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

    // Delete the YouTube connection
    const deleted = await db.platformConnection.deleteMany({
      where: {
        userId: user.id,
        platform: 'youtube',
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: 'No YouTube connection found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'YouTube account disconnected successfully',
    });
  } catch (error) {
    console.error('YouTube disconnect error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect YouTube account' },
      { status: 500 }
    );
  }
}
