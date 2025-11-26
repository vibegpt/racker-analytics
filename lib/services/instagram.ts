/**
 * Instagram Graph API Service
 * Handles Instagram Business Account content fetching
 * https://developers.facebook.com/docs/instagram-api
 */

interface InstagramMedia {
  id: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | 'REELS';
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
  insights?: {
    impressions?: number;
    reach?: number;
    saved?: number;
    shares?: number;
    plays?: number; // For Reels
  };
}

interface InstagramProfile {
  id: string;
  username: string;
  name?: string;
  profile_picture_url?: string;
  followers_count?: number;
  follows_count?: number;
  media_count?: number;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  code: string,
  redirectUri: string
): Promise<{ accessToken: string; userId: string }> {
  try {
    const clientId = process.env.INSTAGRAM_CLIENT_ID || process.env.FACEBOOK_APP_ID;
    const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET || process.env.FACEBOOK_APP_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Instagram/Facebook app credentials not configured');
    }

    // Exchange code for short-lived token
    const tokenUrl = new URL('https://api.instagram.com/oauth/access_token');
    const tokenParams = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code,
    });

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams,
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();
    const shortLivedToken = tokenData.access_token;
    const userId = tokenData.user_id;

    // Exchange short-lived token for long-lived token (60 days)
    const longLivedUrl = new URL('https://graph.instagram.com/access_token');
    longLivedUrl.searchParams.append('grant_type', 'ig_exchange_token');
    longLivedUrl.searchParams.append('client_secret', clientSecret);
    longLivedUrl.searchParams.append('access_token', shortLivedToken);

    const longLivedResponse = await fetch(longLivedUrl);
    const longLivedData = await longLivedResponse.json();

    return {
      accessToken: longLivedData.access_token,
      userId,
    };
  } catch (error) {
    console.error('Error exchanging Instagram code for token:', error);
    throw error;
  }
}

/**
 * Get Instagram Business Account profile
 */
export async function getProfile(accessToken: string, userId: string): Promise<InstagramProfile> {
  try {
    const url = new URL(`https://graph.instagram.com/${userId}`);
    url.searchParams.append('fields', 'id,username,name,profile_picture_url,followers_count,follows_count,media_count');
    url.searchParams.append('access_token', accessToken);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching Instagram profile:', error);
    throw error;
  }
}

/**
 * Get recent Instagram media (posts, reels, stories)
 */
export async function getRecentMedia(
  accessToken: string,
  userId: string,
  limit: number = 50
): Promise<InstagramMedia[]> {
  try {
    // Fetch media
    const mediaUrl = new URL(`https://graph.instagram.com/${userId}/media`);
    mediaUrl.searchParams.append(
      'fields',
      'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count'
    );
    mediaUrl.searchParams.append('limit', limit.toString());
    mediaUrl.searchParams.append('access_token', accessToken);

    const response = await fetch(mediaUrl);

    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.status}`);
    }

    const data = await response.json();
    const media: InstagramMedia[] = data.data || [];

    // Fetch insights for each media item (if available)
    for (const item of media) {
      try {
        item.insights = await getMediaInsights(accessToken, item.id, item.media_type);
      } catch (error) {
        console.log(`Could not fetch insights for media ${item.id}`);
        item.insights = {};
      }
    }

    return media;
  } catch (error) {
    console.error('Error fetching Instagram media:', error);
    throw error;
  }
}

/**
 * Get insights for a media item
 */
async function getMediaInsights(
  accessToken: string,
  mediaId: string,
  mediaType: string
): Promise<{
  impressions?: number;
  reach?: number;
  saved?: number;
  shares?: number;
  plays?: number;
}> {
  try {
    // Different metrics for different media types
    let metrics = 'impressions,reach,saved';

    if (mediaType === 'REELS' || mediaType === 'VIDEO') {
      metrics = 'impressions,reach,saved,plays,shares';
    }

    const insightsUrl = new URL(`https://graph.instagram.com/${mediaId}/insights`);
    insightsUrl.searchParams.append('metric', metrics);
    insightsUrl.searchParams.append('access_token', accessToken);

    const response = await fetch(insightsUrl);

    if (!response.ok) {
      // Insights not available for all media types
      return {};
    }

    const data = await response.json();
    const insights: any = {};

    if (data.data && Array.isArray(data.data)) {
      for (const metric of data.data) {
        insights[metric.name] = metric.values[0]?.value || 0;
      }
    }

    return insights;
  } catch (error) {
    return {};
  }
}

/**
 * Refresh long-lived access token (should be done every 60 days)
 */
export async function refreshAccessToken(accessToken: string): Promise<string> {
  try {
    const url = new URL('https://graph.instagram.com/refresh_access_token');
    url.searchParams.append('grant_type', 'ig_refresh_token');
    url.searchParams.append('access_token', accessToken);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to refresh Instagram access token');
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error refreshing Instagram access token:', error);
    throw error;
  }
}

const instagramService = {
  exchangeCodeForToken,
  getProfile,
  getRecentMedia,
  refreshAccessToken,
};

export default instagramService;
