import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

/**
 * Instagram Disconnect
 * Removes Instagram platform connection for the authenticated user
 *
 * POST /api/auth/instagram/disconnect
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

    // Delete Instagram connection
    await db.platformConnection.deleteMany({
      where: {
        userId: user.id,
        platform: 'instagram',
      },
    });

    console.log(`Instagram disconnected for user ${user.id}`);

    return NextResponse.json({
      success: true,
      message: 'Instagram account disconnected successfully',
    });
  } catch (error) {
    console.error('Error disconnecting Instagram:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect Instagram account' },
      { status: 500 }
    );
  }
}
