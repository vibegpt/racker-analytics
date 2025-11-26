/**
 * Twitch API Service
 * Handles Twitch authentication and stream data fetching
 * https://dev.twitch.tv/docs/api/
 */

interface TwitchTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

interface TwitchUser {
  id: string;
  login: string;
  display_name: string;
  profile_image_url: string;
  view_count: number;
}

interface TwitchStream {
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  title: string;
  viewer_count: number;
  started_at: string;
  thumbnail_url: string;
  type: 'live' | '';
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  code: string,
  redirectUri: string
): Promise<TwitchTokenResponse> {
  try {
    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Twitch app credentials not configured');
    }

    const tokenUrl = 'https://id.twitch.tv/oauth2/token';
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      body: params,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Twitch token exchange failed: ${error}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error exchanging Twitch code for token:', error);
    throw error;
  }
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<TwitchTokenResponse> {
  try {
    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Twitch app credentials not configured');
    }

    const tokenUrl = 'https://id.twitch.tv/oauth2/token';
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      body: params,
    });

    if (!response.ok) {
      throw new Error('Failed to refresh Twitch access token');
    }

    return await response.json();
  } catch (error) {
    console.error('Error refreshing Twitch access token:', error);
    throw error;
  }
}

/**
 * Get authenticated user's profile
 */
export async function getUser(accessToken: string): Promise<TwitchUser> {
  try {
    const clientId = process.env.TWITCH_CLIENT_ID;

    if (!clientId) {
      throw new Error('Twitch client ID not configured');
    }

    const response = await fetch('https://api.twitch.tv/helix/users', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Client-Id': clientId,
      },
    });

    if (!response.ok) {
      throw new Error(`Twitch API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data[0];
  } catch (error) {
    console.error('Error fetching Twitch user:', error);
    throw error;
  }
}

/**
 * Get user's current stream (if live)
 */
export async function getCurrentStream(
  accessToken: string,
  userId: string
): Promise<TwitchStream | null> {
  try {
    const clientId = process.env.TWITCH_CLIENT_ID;

    if (!clientId) {
      throw new Error('Twitch client ID not configured');
    }

    const url = `https://api.twitch.tv/helix/streams?user_id=${userId}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Client-Id': clientId,
      },
    });

    if (!response.ok) {
      throw new Error(`Twitch API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data[0] || null;
  } catch (error) {
    console.error('Error fetching Twitch stream:', error);
    throw error;
  }
}

/**
 * Get past broadcasts (VODs)
 */
export async function getVideos(
  accessToken: string,
  userId: string,
  limit: number = 20
): Promise<any[]> {
  try {
    const clientId = process.env.TWITCH_CLIENT_ID;

    if (!clientId) {
      throw new Error('Twitch client ID not configured');
    }

    const url = `https://api.twitch.tv/helix/videos?user_id=${userId}&first=${limit}&type=archive`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Client-Id': clientId,
      },
    });

    if (!response.ok) {
      throw new Error(`Twitch API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching Twitch videos:', error);
    throw error;
  }
}

/**
 * Get follower count
 */
export async function getFollowerCount(accessToken: string, userId: string): Promise<number> {
  try {
    const clientId = process.env.TWITCH_CLIENT_ID;

    if (!clientId) {
      throw new Error('Twitch client ID not configured');
    }

    const url = `https://api.twitch.tv/helix/channels/followers?broadcaster_id=${userId}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Client-Id': clientId,
      },
    });

    if (!response.ok) {
      throw new Error(`Twitch API error: ${response.status}`);
    }

    const data = await response.json();
    return data.total || 0;
  } catch (error) {
    console.error('Error fetching Twitch followers:', error);
    return 0;
  }
}

const twitchService = {
  exchangeCodeForToken,
  refreshAccessToken,
  getUser,
  getCurrentStream,
  getVideos,
  getFollowerCount,
};

export default twitchService;
