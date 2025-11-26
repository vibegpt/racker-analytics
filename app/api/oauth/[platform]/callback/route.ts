import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { Platform } from "@/lib/oauth/config";
import { SocialPlatform } from "@prisma/client";
import {
  exchangeCodeForToken,
  fetchUserProfile,
} from "@/lib/oauth/utils";

// GET /api/oauth/[platform]/callback - OAuth callback handler
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;
  const cookieStore = await cookies();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;

  // Get return URL from cookie (set during OAuth initiation)
  const returnUrl = cookieStore.get(`oauth_return_${platform}`)?.value || "/onboarding?step=2";

  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.redirect(new URL("/sign-in?error=unauthorized", baseUrl));
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return NextResponse.redirect(new URL("/sign-in?error=user_not_found", baseUrl));
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Check for OAuth errors
    if (error) {
      console.error(`OAuth error for ${platform}:`, error);
      cookieStore.delete(`oauth_state_${platform}`);
      cookieStore.delete(`oauth_verifier_${platform}`);
      cookieStore.delete(`oauth_return_${platform}`);
      const errorUrl = returnUrl.includes("?")
        ? `${returnUrl}&error=${encodeURIComponent(error)}`
        : `${returnUrl}?error=${encodeURIComponent(error)}`;
      return NextResponse.redirect(new URL(errorUrl, baseUrl));
    }

    if (!code || !state) {
      const errorUrl = returnUrl.includes("?")
        ? `${returnUrl}&error=missing_params`
        : `${returnUrl}?error=missing_params`;
      return NextResponse.redirect(new URL(errorUrl, baseUrl));
    }

    // Verify state to prevent CSRF attacks
    const storedState = cookieStore.get(`oauth_state_${platform}`)?.value;
    const codeVerifier = cookieStore.get(`oauth_verifier_${platform}`)?.value;

    if (!storedState || storedState !== state) {
      cookieStore.delete(`oauth_state_${platform}`);
      cookieStore.delete(`oauth_verifier_${platform}`);
      cookieStore.delete(`oauth_return_${platform}`);
      const errorUrl = returnUrl.includes("?")
        ? `${returnUrl}&error=invalid_state`
        : `${returnUrl}?error=invalid_state`;
      return NextResponse.redirect(new URL(errorUrl, baseUrl));
    }

    // Exchange authorization code for access token
    const tokenData = await exchangeCodeForToken(
      platform as Platform,
      code,
      codeVerifier
    );

    // Fetch user profile from OAuth provider
    const profile = await fetchUserProfile(
      platform as Platform,
      tokenData.access_token
    );

    // Map platform string to SocialPlatform enum
    const platformEnum = platform.toUpperCase() as SocialPlatform;

    // Check if account already exists for this user and platform
    const existingAccount = await db.socialAccount.findFirst({
      where: {
        userId: user.id,
        platform: platformEnum,
      },
    });

    if (existingAccount) {
      // Update existing account with new tokens
      await db.socialAccount.update({
        where: { id: existingAccount.id },
        data: {
          platformId: profile.id,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          tokenExpiry: tokenData.expires_in
            ? new Date(Date.now() + tokenData.expires_in * 1000)
            : null,
          username: profile.username,
          displayName: profile.displayName || existingAccount.displayName,
          avatarUrl: profile.avatarUrl || existingAccount.avatarUrl,
          followerCount: profile.followerCount || existingAccount.followerCount,
          isVerified: profile.isVerified || existingAccount.isVerified,
          connected: true,
        },
      });
    } else {
      // Create new social account
      await db.socialAccount.create({
        data: {
          userId: user.id,
          platform: platformEnum,
          platformId: profile.id,
          username: profile.username,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          tokenExpiry: tokenData.expires_in
            ? new Date(Date.now() + tokenData.expires_in * 1000)
            : null,
          followerCount: profile.followerCount,
          isVerified: profile.isVerified || false,
          connected: true,
        },
      });
    }

    // Clear OAuth cookies
    cookieStore.delete(`oauth_state_${platform}`);
    cookieStore.delete(`oauth_verifier_${platform}`);
    cookieStore.delete(`oauth_return_${platform}`);

    console.log(`Social account connected: ${platform} for user ${user.id}`);

    // Redirect back with success
    const successUrl = returnUrl.includes("?")
      ? `${returnUrl}&success=connected&platform=${platform}`
      : `${returnUrl}?success=connected&platform=${platform}`;

    return NextResponse.redirect(new URL(successUrl, baseUrl));
  } catch (error) {
    console.error("OAuth callback error:", error);

    cookieStore.delete(`oauth_state_${platform}`);
    cookieStore.delete(`oauth_verifier_${platform}`);
    cookieStore.delete(`oauth_return_${platform}`);

    const errorMessage = error instanceof Error ? error.message : "oauth_failed";
    const errorUrl = returnUrl.includes("?")
      ? `${returnUrl}&error=${encodeURIComponent(errorMessage)}`
      : `${returnUrl}?error=${encodeURIComponent(errorMessage)}`;

    return NextResponse.redirect(new URL(errorUrl, baseUrl));
  }
}