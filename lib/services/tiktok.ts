/**
 * TikTok API Service
 * Handles TikTok authentication and content data fetching
 * https://developers.tiktok.com/doc/overview
 */

interface TikTokTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
  scope: string;
  open_id: string;
}

interface TikTokUser {
  open_id: string;
  union_id: string;
  avatar_url: string;
  avatar_url_100: string;
  avatar_large_url: string;
  display_name: string;
  bio_description?: string;
  profile_deep_link: string;
  is_verified: boolean;
  follower_count?: number;
  following_count?: number;
  likes_count?: number;
  video_count?: number;
}

interface TikTokVideo {
  id: string;
  title?: string;
  video_description: string;
  create_time: number;
  cover_image_url: string;
  share_url: string;
  duration: number;
  height: number;
  width: number;
  embed_html?: string;
  embed_link?: string;
  like_count?: number;
  comment_count?: number;
  share_count?: number;
  view_count?: number;
}

interface TikTokVideoListResponse {
  videos: TikTokVideo[];
  cursor: number;
  has_more: boolean;
}

/**
 * Exchange authorization code for access token (with PKCE)
 */
export async function exchangeCodeForToken(
  code: string,
  redirectUri: string,
  codeVerifier: string
): Promise<TikTokTokenResponse> {
  try {
    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

    if (!clientKey || !clientSecret) {
      throw new Error('TikTok app credentials not configured');
    }

    const tokenUrl = 'https://open.tiktokapis.com/v2/oauth/token/';

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache',
      },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`TikTok token exchange failed: ${error}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error exchanging TikTok code for token:', error);
    throw error;
  }
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<TikTokTokenResponse> {
  try {
    const clientKey = process.env.TIKTOK_CLIENT_KEY;

    if (!clientKey) {
      throw new Error('TikTok client key not configured');
    }

    const tokenUrl = 'https://open.tiktokapis.com/v2/oauth/token/';

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache',
      },
      body: new URLSearchParams({
        client_key: clientKey,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh TikTok access token');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error refreshing TikTok access token:', error);
    throw error;
  }
}

/**
 * Get authenticated user's profile
 */
export async function getUserInfo(accessToken: string): Promise<TikTokUser> {
  try {
    const url = 'https://open.tiktokapis.com/v2/user/info/';

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`TikTok API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.data.user;
  } catch (error) {
    console.error('Error fetching TikTok user info:', error);
    throw error;
  }
}

/**
 * Get user's videos with pagination
 */
export async function getUserVideos(
  accessToken: string,
  maxCount: number = 20,
  cursor: number = 0
): Promise<TikTokVideoListResponse> {
  try {
    const url = 'https://open.tiktokapis.com/v2/video/list/';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        max_count: maxCount,
        cursor: cursor,
        // Request video fields
        fields: [
          'id',
          'title',
          'video_description',
          'create_time',
          'cover_image_url',
          'share_url',
          'duration',
          'height',
          'width',
          'like_count',
          'comment_count',
          'share_count',
          'view_count',
        ].join(','),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`TikTok API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching TikTok videos:', error);
    throw error;
  }
}

/**
 * Get all user videos (handles pagination automatically)
 */
export async function getAllUserVideos(
  accessToken: string,
  maxVideos: number = 50
): Promise<TikTokVideo[]> {
  const allVideos: TikTokVideo[] = [];
  let cursor = 0;
  let hasMore = true;

  try {
    while (hasMore && allVideos.length < maxVideos) {
      const batchSize = Math.min(20, maxVideos - allVideos.length); // Max 20 per request
      const result = await getUserVideos(accessToken, batchSize, cursor);

      if (result.videos && result.videos.length > 0) {
        allVideos.push(...result.videos);
      }

      hasMore = result.has_more;
      cursor = result.cursor;

      // Avoid hitting rate limits
      if (hasMore && allVideos.length < maxVideos) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      }
    }

    return allVideos;
  } catch (error) {
    console.error('Error fetching all TikTok videos:', error);
    throw error;
  }
}

const tiktokService = {
  exchangeCodeForToken,
  refreshAccessToken,
  getUserInfo,
  getUserVideos,
  getAllUserVideos,
};

export default tiktokService;
