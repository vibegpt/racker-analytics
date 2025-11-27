/**
 * Insights API - Creator Reports
 *
 * GET /api/insights - Get personalized insights report for authenticated creator
 * GET /api/insights?niche=TRAVEL&country=US - Get aggregate report
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient, CreatorNiche } from '@prisma/client';
import { getInsightsEngine } from '@/lib/insights';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    const searchParams = request.nextUrl.searchParams;
    const nicheParam = searchParams.get('niche');
    const countryParam = searchParams.get('country');
    const platformParam = searchParams.get('platform');
    const reportType = searchParams.get('type') || 'creator'; // 'creator' or 'aggregate'

    const engine = getInsightsEngine();

    // Aggregate report (public, no auth required)
    if (reportType === 'aggregate' || (nicheParam && !clerkId)) {
      const report = engine.generateAggregateReport({
        niche: nicheParam as CreatorNiche | undefined,
        country: countryParam || undefined,
        platform: platformParam as any || undefined,
      });

      return NextResponse.json({
        success: true,
        type: 'aggregate',
        report,
      });
    }

    // Creator report (requires auth)
    if (!clerkId) {
      return NextResponse.json(
        { error: 'Authentication required for personal insights' },
        { status: 401 }
      );
    }

    // Get user and their profile
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const profile = await prisma.creatorProfile.findUnique({
      where: { userId: user.id },
      select: { niche: true, country: true },
    });

    const report = engine.generateCreatorReport(
      profile?.niche || undefined,
      profile?.country || undefined
    );

    return NextResponse.json({
      success: true,
      type: 'creator',
      report,
      profile: profile || null,
    });

  } catch (error) {
    console.error('[Insights API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}
