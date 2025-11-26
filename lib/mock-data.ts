export interface StreamEvent {
  id: string;
  type: 'stream_start' | 'raid' | 'donation' | 'stream_end';
  timestamp: number; // Unix timestamp
  label: string;
  value?: number;
}

export interface PricePoint {
  timestamp: number;
  price: number;
}

export interface StreamData {
  id: string;
  streamerName: string;
  streamerAvatar: string;
  streamThumbnail: string;
  streamUrl?: string; // URL for the video/stream
  platform: 'pump' | 'zora' | 'twitch' | 'youtube';
  contentType: 'stream' | 'content_coin' | 'clip'; // Updated to 'content_coin'
  contentCoinSymbol?: string; // e.g., $POST1
  title: string;
  viewCount: number;
  priceImpact: number; // Percentage change (Creator Coin or Content Coin)
  priceHistory: PricePoint[];
  events: StreamEvent[];
}

export const MOCK_STREAM_DATA: StreamData = {
  id: '1',
  streamerName: 'CryptoKing',
  streamerAvatar: 'https://github.com/shadcn.png',
  streamThumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=2670&ixlib=rb-4.0.3',
  platform: 'pump',
  contentType: 'stream',
  title: 'LAUNCHING MY COIN! 🚀',
  viewCount: 12500,
  priceImpact: 45.2,
  priceHistory: Array.from({ length: 50 }, (_, i) => ({
    timestamp: Date.now() - (50 - i) * 60000,
    price: 10 + Math.random() * 5 + (i > 20 ? i * 0.5 : 0), // Simulated pump
  })),
  events: [
    { id: 'e1', type: 'stream_start', timestamp: Date.now() - 45 * 60000, label: 'Stream Start' },
    { id: 'e2', type: 'donation', timestamp: Date.now() - 30 * 60000, label: '10 SOL Dono', value: 10 },
    { id: 'e3', type: 'raid', timestamp: Date.now() - 10 * 60000, label: 'Raid by @Whale' },
  ],
};

const TITLES = [
  "APEING INTO NEW MINTS 🦍",
  "100X GEM HUNTING 💎",
  "CHART ANALYSIS + VIBES 📈",
  "RUG CHECKING LIVE 🚨",
  "PUMP.FUN SPEEDRUN 🏃‍♂️",
  "WHALE WATCHING 🐋",
  "LATE NIGHT DEGEN HOURS 🌙",
  "ETH TO SOL BRIDGE TUTORIAL 🌉",
  "MEME COIN MASTERCLASS 🎓",
  "LIVE TRADING SESSION 💰"
];

const ZORA_TITLES = [
  "MINT MY NEW DROP 🎨",
  "GEN ART REVEAL ✨",
  "ONCHAIN SUMMER VIBES ☀️",
  "MUSIC NFT DROP 🎵",
  "COLLECT THIS MOMENT 📸"
];

const PLATFORMS = ['pump', 'zora', 'twitch', 'youtube'] as const;

export function generateMockStreams(count: number): StreamData[] {
  return Array.from({ length: count }, (_, i) => {
    const platform = PLATFORMS[i % PLATFORMS.length];
    const isZora = platform === 'zora';

    return {
      ...MOCK_STREAM_DATA,
      id: `stream-${i}`,
      streamerName: `Creator_${Math.floor(i / 5) + 1}`, // 1 creator every 5 streams
      title: isZora ? ZORA_TITLES[i % ZORA_TITLES.length] : TITLES[i % TITLES.length],
      platform: platform,
      contentType: isZora ? 'content_coin' : 'stream',
      contentCoinSymbol: isZora ? `$POST${i}` : undefined,
      priceImpact: Number((Math.random() * 100 - 20).toFixed(1)), // Range -20 to +80
      viewCount: Math.floor(Math.random() * 50000) + 1000,
      streamThumbnail: `https://images.unsplash.com/photo-${[
        '1614680376593-902f74cf0d41',
        '1531297461136-82lw9b28330',
        '1492619175355-f974d3cc8842',
        '1518186285589-a4296f930545',
        '1551288049-bebda4e38f71'
      ][i % 5]}?auto=format&fit=crop&q=80&w=800`,
    };
  });
}

export interface ProjectStats {
  coinName: string;
  coinSymbol: string;
  price: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
  holders: number;
}


export const MOCK_PROJECT_STATS: ProjectStats = {
  coinName: "Creator Coin",
  coinSymbol: "$CRTR",
  price: 12.45,
  priceChange24h: 8.2,
  marketCap: 1250000,
  volume24h: 45000,
  holders: 3200,
};

// --- Correlation Mock Data ---

import { RevenueEvent } from "./correlation/types";
import { AttributedContent } from "./attribution/types";

const NOW = Date.now();
const HOUR = 60 * 60 * 1000;


export const MOCK_REVENUE_EVENTS: RevenueEvent[] = [
  {
    id: 'rev_1',
    source: 'stripe',
    amount: 50.00,
    currency: 'USD',
    timestamp: new Date(NOW - 2 * HOUR), // 2 hours ago
    description: 'Premium Subscription',
    customerEmail: 'fan1@example.com',
    location: { city: 'New York', country: 'US' }
  },
  {
    id: 'rev_2',
    source: 'patreon',
    amount: 5.00,
    currency: 'USD',
    timestamp: new Date(NOW - 5 * HOUR), // 5 hours ago
    description: 'Monthly Pledge',
    customerEmail: 'fan2@example.com',
    location: { city: 'London', country: 'UK' }
  },
  {
    id: 'rev_3',
    source: 'amazon',
    amount: 120.00,
    currency: 'USD',
    timestamp: new Date(NOW - 24 * HOUR), // 1 day ago
    description: 'Affiliate Commission (Camera Gear)',
    location: { city: 'Los Angeles', country: 'US' }
  }
];

export const MOCK_ATTRIBUTED_CONTENT: AttributedContent[] = [
  {
    projectId: 'proj_1',
    socialAccountId: 'acc_twitter',
    contentId: 'tweet_1',
    contentType: 'tweet',
    contentUrl: 'https://twitter.com/user/status/123',
    contentText: 'Just dropped a new premium guide! Link in bio 🚀',
    postedAt: new Date(NOW - 3 * HOUR), // 3 hours ago (1 hour before rev_1)
    attributionReason: 'manual_override',
    matchedKeywords: [],

    confidence: 1.0,
    likes: 150,
    retweets: 20,
    manuallyAdjusted: false,
    audienceBreakdown: [
      { city: 'New York', country: 'US', percentage: 0.45 },
      { city: 'London', country: 'UK', percentage: 0.20 },
      { city: 'Toronto', country: 'CA', percentage: 0.10 }
    ]
  },
  {
    projectId: 'proj_1',
    socialAccountId: 'acc_youtube',
    contentId: 'yt_1',
    contentType: 'video',
    contentUrl: 'https://youtube.com/watch?v=abc',
    contentText: 'My Camera Gear Setup 2025',
    postedAt: new Date(NOW - 26 * HOUR), // 26 hours ago (2 hours before rev_3)
    attributionReason: 'hashtag',
    matchedKeywords: ['#camera', '#gear'],
    confidence: 0.9,
    views: 5000,
    manuallyAdjusted: false,
    audienceBreakdown: [
      { city: 'Los Angeles', country: 'US', percentage: 0.35 },
      { city: 'New York', country: 'US', percentage: 0.15 },
      { city: 'Chicago', country: 'US', percentage: 0.10 }
    ]
  }
];

