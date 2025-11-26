
export type SentimentPlatform = 'twitch' | 'youtube' | 'twitter' | 'discord';

export interface ChatMessage {
    id: string;
    userId: string;
    username: string;
    text: string;
    timestamp: Date;
    platform: SentimentPlatform;

    // Metadata for bot detection
    isSubscriber?: boolean;
    accountAgeDays?: number;

    // Analysis Results (populated by engine)
    analysis?: {
        isBot: boolean;
        spamScore: number;      // 0.0 - 1.0 (High = Spam)
        sentimentScore: number; // -1.0 to 1.0 (Positive/Negative)
        keywords: string[];
    };
}

export interface SentimentWindow {
    timestamp: Date;          // Start of the window (e.g. 10:00 AM)
    durationMinutes: number;

    totalMessages: number;
    botCount: number;
    genuineCount: number;


    averageSentiment: number; // -1.0 to 1.0
    sentimentVelocity?: number; // Rate of change (dSentiment/dt)
    sentimentAcceleration?: number; // Rate of rate of change (d2Sentiment/dt2)
    hypeScore: number;        // 0 - 100 (Volume * Sentiment)

    topKeywords: { word: string; count: number }[];
}
