import { google, youtube_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

/**
 * YouTube API Service
 * Handles OAuth, channel info, video analytics, and demographics
 * Integrated with Bagger's unified Web2+Web3 creator analytics
 */
export class YouTubeService {
  private oauth2Client: OAuth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/youtube/callback`
    );
  }

  /**
   * Generate YouTube OAuth authorization URL
   * @param state - Base64 encoded JSON with userId and timestamp for CSRF protection
   */
  getAuthUrl(state: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/yt-analytics.readonly',
      'https://www.googleapis.com/auth/yt-analytics-monetary.readonly',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: state,
      prompt: 'consent', // Force consent screen to get refresh token
    });
  }

  /**
   * Exchange authorization code for access/refresh tokens
   */
  async getTokensFromCode(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens;
  }

  /**
   * Refresh an expired access token using the refresh token
   */
  async refreshAccessToken(refreshToken: string) {
    this.oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });
    const { credentials } = await this.oauth2Client.refreshAccessToken();
    return credentials;
  }

  private getYouTubeClient(accessToken: string) {
    this.oauth2Client.setCredentials({
      access_token: accessToken,
    });
    return google.youtube({ version: 'v3', auth: this.oauth2Client });
  }

  private getYouTubeAnalyticsClient(accessToken: string) {
    this.oauth2Client.setCredentials({
      access_token: accessToken,
    });
    return google.youtubeAnalytics({ version: 'v2', auth: this.oauth2Client });
  }

  /**
   * Get channel information (for initial connection)
   */
  async getChannelInfo(accessToken: string) {
    const youtube = this.getYouTubeClient(accessToken);

    const response = await youtube.channels.list({
      part: ['snippet', 'statistics', 'contentDetails'],
      mine: true,
    });

    if (!response.data.items || response.data.items.length === 0) {
      throw new Error('No channel found');
    }

    const channel = response.data.items[0];
    return {
      id: channel.id!,
      title: channel.snippet?.title,
      description: channel.snippet?.description,
      customUrl: channel.snippet?.customUrl,
      thumbnailUrl: channel.snippet?.thumbnails?.default?.url,
      subscriberCount: parseInt(channel.statistics?.subscriberCount || '0'),
      videoCount: parseInt(channel.statistics?.videoCount || '0'),
      viewCount: parseInt(channel.statistics?.viewCount || '0'),
    };
  }

  /**
   * Get channel analytics for a date range
   */
  async getChannelAnalytics(accessToken: string, channelId: string, startDate: string, endDate: string) {
    const youtubeAnalytics = this.getYouTubeAnalyticsClient(accessToken);

    const response = await youtubeAnalytics.reports.query({
      ids: `channel==${channelId}`,
      startDate,
      endDate,
      metrics: [
        'views',
        'likes',
        'comments',
        'shares',
        'estimatedMinutesWatched',
        'averageViewDuration',
        'subscribersGained',
        'subscribersLost',
      ].join(','),
      dimensions: 'day',
    });

    return response.data;
  }

  /**
   * Get audience demographics (age, gender, geography)
   */
  async getDemographics(accessToken: string, channelId: string, startDate: string, endDate: string) {
    const youtubeAnalytics = this.getYouTubeAnalyticsClient(accessToken);

    // Age and gender
    const demographicsResponse = await youtubeAnalytics.reports.query({
      ids: `channel==${channelId}`,
      startDate,
      endDate,
      metrics: 'viewerPercentage',
      dimensions: 'ageGroup,gender',
    });

    // Geography
    const geographyResponse = await youtubeAnalytics.reports.query({
      ids: `channel==${channelId}`,
      startDate,
      endDate,
      metrics: 'views',
      dimensions: 'country',
      sort: '-views',
      maxResults: 10,
    });

    return {
      demographics: demographicsResponse.data,
      geography: geographyResponse.data,
    };
  }

  /**
   * Get recent videos from a channel
   * Returns video IDs, titles, thumbnails, and basic stats
   */
  async getRecentVideos(accessToken: string, channelId: string, maxResults: number = 50) {
    const youtube = this.getYouTubeClient(accessToken);

    const response = await youtube.search.list({
      part: ['snippet'],
      channelId,
      order: 'date',
      type: ['video'],
      maxResults,
    });

    if (!response.data.items) {
      return [];
    }

    // Get statistics for each video
    const videoIds = response.data.items.map((item) => item.id?.videoId).filter(Boolean) as string[];

    if (videoIds.length === 0) {
      return [];
    }

    const statsResponse = await youtube.videos.list({
      part: ['statistics', 'contentDetails'],
      id: videoIds,
    });

    return response.data.items.map((item, index) => {
      const stats = statsResponse.data.items?.[index]?.statistics;
      const contentDetails = statsResponse.data.items?.[index]?.contentDetails;

      return {
        id: item.id?.videoId,
        title: item.snippet?.title,
        description: item.snippet?.description,
        thumbnailUrl: item.snippet?.thumbnails?.medium?.url,
        publishedAt: item.snippet?.publishedAt,
        views: parseInt(stats?.viewCount || '0'),
        likes: parseInt(stats?.likeCount || '0'),
        comments: parseInt(stats?.commentCount || '0'),
        duration: contentDetails?.duration,
      };
    });
  }

  /**
   * Get detailed analytics for a specific video
   */
  async getVideoAnalytics(
    accessToken: string,
    videoId: string,
    startDate: string,
    endDate: string
  ) {
    const youtubeAnalytics = this.getYouTubeAnalyticsClient(accessToken);

    const response = await youtubeAnalytics.reports.query({
      ids: 'channel==MINE',
      startDate,
      endDate,
      metrics: [
        'views',
        'likes',
        'comments',
        'shares',
        'estimatedMinutesWatched',
        'averageViewDuration',
        'averageViewPercentage',
      ].join(','),
      filters: `video==${videoId}`,
    });

    return response.data;
  }

  /**
   * Get estimated revenue (requires monetization)
   */
  async getEstimatedRevenue(accessToken: string, channelId: string, startDate: string, endDate: string) {
    const youtubeAnalytics = this.getYouTubeAnalyticsClient(accessToken);

    try {
      const response = await youtubeAnalytics.reports.query({
        ids: `channel==${channelId}`,
        startDate,
        endDate,
        metrics: 'estimatedRevenue,estimatedAdRevenue,estimatedRedPartnerRevenue',
        dimensions: 'day',
      });

      return response.data;
    } catch (error) {
      // Revenue metrics require monetization to be enabled
      console.error('Revenue metrics not available:', error);
      return null;
    }
  }
}

// Export singleton instance
export const youtubeService = new YouTubeService();
