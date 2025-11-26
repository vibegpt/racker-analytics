import crypto from "crypto";
import { OAUTH_CONFIG, Platform } from "./config";

/**
 * Generate a secure random state string for OAuth CSRF protection
 */
export function generateState(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Generate PKCE code verifier and challenge for enhanced OAuth security
 */
export function generatePKCE() {
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  return {
    codeVerifier,
    codeChallenge,
    codeChallengeMethod: "S256" as const,
  };
}

/**
 * Build OAuth authorization URL
 */
export function buildAuthUrl(
  platform: Platform,
  state: string,
  codeChallenge?: string
): string {
  const config = OAUTH_CONFIG[platform];
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: config.scopes.join(" "),
    state,
  });

  // Add PKCE for platforms that support it (Twitter requires it)
  if (codeChallenge) {
    params.append("code_challenge", codeChallenge);
    params.append("code_challenge_method", "S256");
  }

  // Add access_type=offline for Google/YouTube to get refresh tokens
  if (platform === "youtube") {
    params.append("access_type", "offline");
    params.append("prompt", "consent"); // Force consent screen to always get refresh token
  }

  return `${config.authUrl}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  platform: Platform,
  code: string,
  codeVerifier?: string
): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type: string;
}> {
  const config = OAUTH_CONFIG[platform];

  const body: Record<string, string> = {
    grant_type: "authorization_code",
    code,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  };

  // Add PKCE verifier for platforms that require it
  if (codeVerifier) {
    body.code_verifier = codeVerifier;
  }

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed for ${platform}: ${error}`);
  }

  return response.json();
}

/**
 * Refresh an OAuth access token
 */
export async function refreshAccessToken(
  platform: Platform,
  refreshToken: string
): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}> {
  const config = OAUTH_CONFIG[platform];

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed for ${platform}: ${error}`);
  }

  return response.json();
}

/**
 * Fetch user profile from OAuth provider
 */
export async function fetchUserProfile(
  platform: Platform,
  accessToken: string
): Promise<{
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  email?: string;
  followerCount?: number;
  isVerified?: boolean;
}> {
  const config = OAUTH_CONFIG[platform];

  switch (platform) {
    case "twitter":
      return fetchTwitterProfile(accessToken);
    case "youtube":
      return fetchYouTubeProfile(accessToken);
    case "twitch":
      return fetchTwitchProfile(accessToken, config.clientId);
    case "instagram":
      return fetchInstagramProfile(accessToken);
    case "tiktok":
      return fetchTikTokProfile(accessToken);
    case "discord":
      return fetchDiscordProfile(accessToken);
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

// Platform-specific profile fetchers

async function fetchTwitterProfile(accessToken: string) {
  const response = await fetch(
    "https://api.twitter.com/2/users/me?user.fields=profile_image_url,public_metrics,verified",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch Twitter profile");
  }

  const { data } = await response.json();
  return {
    id: data.id,
    username: `@${data.username}`,
    displayName: data.name,
    avatarUrl: data.profile_image_url?.replace("_normal", "_400x400"), // Get larger image
    followerCount: data.public_metrics?.followers_count,
    isVerified: data.verified || false,
  };
}

async function fetchYouTubeProfile(accessToken: string) {
  const response = await fetch(
    "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("YouTube API error:", response.status, errorText);
    throw new Error(`Failed to fetch YouTube profile: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const { items } = data;

  if (!items || items.length === 0) {
    console.error("YouTube API returned no channels:", data);
    throw new Error("No YouTube channel found for this account");
  }

  const channel = items[0];

  return {
    id: channel.id,
    username: `@${channel.snippet.customUrl || channel.snippet.title}`,
    displayName: channel.snippet.title,
    avatarUrl: channel.snippet.thumbnails?.high?.url,
    followerCount: parseInt(channel.statistics?.subscriberCount || "0"),
    isVerified: false, // YouTube API doesn't directly expose verification
  };
}

async function fetchTwitchProfile(accessToken: string, clientId: string) {
  const response = await fetch("https://api.twitch.tv/helix/users", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Client-Id": clientId,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch Twitch profile");
  }

  const { data } = await response.json();
  const user = data[0];

  // Fetch follower count separately
  const followersResponse = await fetch(
    `https://api.twitch.tv/helix/channels/followers?broadcaster_id=${user.id}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Client-Id": clientId,
      },
    }
  );

  let followerCount = 0;
  if (followersResponse.ok) {
    const followersData = await followersResponse.json();
    followerCount = followersData.total || 0;
  }

  return {
    id: user.id,
    username: user.login,
    displayName: user.display_name,
    avatarUrl: user.profile_image_url,
    email: user.email,
    followerCount,
    isVerified: user.broadcaster_type === "partner",
  };
}

async function fetchInstagramProfile(accessToken: string) {
  const response = await fetch(
    "https://graph.instagram.com/me?fields=id,username,account_type,media_count",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch Instagram profile");
  }

  const data = await response.json();
  return {
    id: data.id,
    username: `@${data.username}`,
    displayName: data.username,
    isVerified: data.account_type === "BUSINESS",
  };
}

async function fetchTikTokProfile(accessToken: string) {
  const response = await fetch(
    "https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,follower_count,is_verified",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch TikTok profile");
  }

  const { data } = await response.json();
  return {
    id: data.user.open_id,
    username: `@${data.user.display_name}`,
    displayName: data.user.display_name,
    avatarUrl: data.user.avatar_url,
    followerCount: data.user.follower_count,
    isVerified: data.user.is_verified,
  };
}

async function fetchDiscordProfile(accessToken: string) {
  const response = await fetch("https://discord.com/api/users/@me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch Discord profile");
  }

  const data = await response.json();
  return {
    id: data.id,
    username: data.username,
    displayName: data.global_name || data.username,
    avatarUrl: data.avatar
      ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png`
      : undefined,
    email: data.email,
    isVerified: data.verified || false,
  };
}
