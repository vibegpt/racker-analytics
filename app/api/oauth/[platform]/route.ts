import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { Platform, OAUTH_CONFIG } from "@/lib/oauth/config";
import { generateState, generatePKCE, buildAuthUrl } from "@/lib/oauth/utils";

// GET /api/oauth/[platform] - Initiate OAuth flow
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    const { platform } = await params;

    // Validate platform
    const validPlatforms: Platform[] = [
      "twitter",
      "youtube",
      "twitch",
      "instagram",
      "tiktok",
      "discord",
    ];

    if (!validPlatforms.includes(platform as Platform)) {
      return NextResponse.json(
        { error: "Invalid platform" },
        { status: 400 }
      );
    }

    // Check if platform credentials are configured
    const config = OAUTH_CONFIG[platform as Platform];
    if (!config.clientId || !config.clientSecret) {
      console.error(`OAuth not configured for ${platform}`);
      const returnUrl = request.nextUrl.searchParams.get("return_url") || "/onboarding?step=2";
      return NextResponse.redirect(
        new URL(`${returnUrl}&error=not_configured`, request.url)
      );
    }

    // Get return URL from query params
    const returnUrl = request.nextUrl.searchParams.get("return_url") || "/onboarding?step=2";

    // Generate state for CSRF protection
    const state = generateState();

    // Generate PKCE for enhanced security (required for Twitter, optional for others)
    const pkce = generatePKCE();

    // Store state, PKCE, and return URL in HTTP-only cookies
    const cookieStore = await cookies();
    
    cookieStore.set(`oauth_state_${platform}`, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    cookieStore.set(`oauth_verifier_${platform}`, pkce.codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    cookieStore.set(`oauth_return_${platform}`, returnUrl, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    // Build authorization URL
    const authUrl = buildAuthUrl(
      platform as Platform,
      state,
      pkce.codeChallenge
    );

    // Redirect to OAuth provider
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("OAuth initiation error:", error);
    return NextResponse.json(
      { error: "Failed to initiate OAuth flow" },
      { status: 500 }
    );
  }
}
