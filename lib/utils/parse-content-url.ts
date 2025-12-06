import { Platform } from "@prisma/client";

interface ParsedContent {
  platform: Platform;
  contentId: string;
  embedUrl: string;
}

export function parseContentUrl(url: string): ParsedContent | null {
  try {
    const parsed = new URL(url);

    // Twitter/X
    if (parsed.hostname.includes('twitter.com') || parsed.hostname.includes('x.com')) {
      const match = parsed.pathname.match(/\/status\/(\d+)/);
      if (match) {
        return {
          platform: 'TWITTER',
          contentId: match[1],
          embedUrl: `https://platform.twitter.com/embed/Tweet.html?id=${match[1]}`,
        };
      }
    }

    // YouTube
    if (parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtu.be')) {
      let videoId: string | null = null;

      if (parsed.hostname.includes('youtu.be')) {
        videoId = parsed.pathname.slice(1);
      } else if (parsed.pathname.includes('/shorts/')) {
        const match = parsed.pathname.match(/\/shorts\/([A-Za-z0-9_-]+)/);
        videoId = match ? match[1] : null;
      } else {
        videoId = parsed.searchParams.get('v');
      }

      if (videoId) {
        return {
          platform: 'YOUTUBE',
          contentId: videoId,
          embedUrl: `https://www.youtube.com/embed/${videoId}`,
        };
      }
    }

    // Instagram
    if (parsed.hostname.includes('instagram.com')) {
      const match = parsed.pathname.match(/\/(p|reel|reels)\/([A-Za-z0-9_-]+)/);
      if (match) {
        return {
          platform: 'INSTAGRAM',
          contentId: match[2],
          embedUrl: `https://www.instagram.com/p/${match[2]}/embed`,
        };
      }
    }

    // TikTok
    if (parsed.hostname.includes('tiktok.com')) {
      // Handle both /video/123 and /@user/video/123 formats
      const match = parsed.pathname.match(/\/video\/(\d+)/);
      if (match) {
        return {
          platform: 'TIKTOK',
          contentId: match[1],
          embedUrl: `https://www.tiktok.com/embed/v2/${match[1]}`,
        };
      }
    }

    // LinkedIn
    if (parsed.hostname.includes('linkedin.com')) {
      const match = parsed.pathname.match(/\/posts\/([^/?]+)/);
      if (match) {
        return {
          platform: 'OTHER', // LinkedIn embeds are complex, treat as OTHER
          contentId: match[1],
          embedUrl: url,
        };
      }
    }

    // Facebook
    if (parsed.hostname.includes('facebook.com') || parsed.hostname.includes('fb.watch')) {
      return {
        platform: 'OTHER',
        contentId: parsed.pathname,
        embedUrl: url,
      };
    }

    // Threads
    if (parsed.hostname.includes('threads.net')) {
      const match = parsed.pathname.match(/\/post\/([A-Za-z0-9_-]+)/);
      if (match) {
        return {
          platform: 'OTHER',
          contentId: match[1],
          embedUrl: url,
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

// Helper to generate embed URL from stored data
export function getEmbedUrl(platform: Platform, contentId: string): string {
  switch (platform) {
    case 'TWITTER':
      return `https://platform.twitter.com/embed/Tweet.html?id=${contentId}`;
    case 'YOUTUBE':
      return `https://www.youtube.com/embed/${contentId}`;
    case 'INSTAGRAM':
      return `https://www.instagram.com/p/${contentId}/embed`;
    case 'TIKTOK':
      return `https://www.tiktok.com/embed/v2/${contentId}`;
    default:
      return '';
  }
}
