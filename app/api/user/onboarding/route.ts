/**
 * USER ONBOARDING API
 * 
 * GET /api/user/onboarding - Get onboarding status
 * POST /api/user/onboarding - Mark onboarding as complete
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await db.user.findUnique({
      where: { clerkId },
      include: {
        socialAccounts: {
          select: { platform: true, connected: true }
        },
        smartLinks: {
          take: 1,
          orderBy: { createdAt: "asc" }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ 
        completed: false,
        steps: {
          stripeConnected: false,
          socialsConnected: [],
          firstLinkCreated: false
        }
      });
    }

    // Check connected social accounts
    const connectedSocials = user.socialAccounts
      .filter(acc => acc.connected)
      .map(acc => acc.platform.toLowerCase());

    return NextResponse.json({
      completed: user.onboardingCompleted || false,
      completedAt: user.onboardingCompletedAt,
      steps: {
        stripeConnected: !!user.stripeConnectId,
        stripeAccountId: user.stripeConnectId,
        socialsConnected: connectedSocials,
        firstLinkCreated: user.smartLinks.length > 0,
        firstLinkSlug: user.smartLinks[0]?.slug
      }
    });

  } catch (error) {
    console.error("[Onboarding] GET Error:", error);
    return NextResponse.json(
      { error: "Failed to get onboarding status" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { completed, data } = body;

    // Find or create user
    let user = await db.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      // Create user if doesn't exist (shouldn't happen normally)
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Update onboarding status
    if (completed) {
      user = await db.user.update({
        where: { clerkId },
        data: {
          onboardingCompleted: true,
          onboardingCompletedAt: new Date(),
        }
      });
    }

    return NextResponse.json({
      success: true,
      completed: user.onboardingCompleted,
      completedAt: user.onboardingCompletedAt,
      name: user.name,
    });

  } catch (error) {
    console.error("[Onboarding] POST Error:", error);
    return NextResponse.json(
      { error: "Failed to update onboarding status" },
      { status: 500 }
    );
  }
}
