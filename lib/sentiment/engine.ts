
import { ChatMessage, SentimentWindow } from "./types";

export class SentimentEngine {

    /**
     * Analyze a single message to determine if it's spam and its sentiment
     */
    analyzeMessage(message: ChatMessage): ChatMessage {
        const analysis = {
            isBot: false,
            spamScore: 0,
            sentimentScore: 0,
            keywords: [] as string[]
        };

        // 1. Bot Detection Logic
        const botKeywords = ["buy followers", "airdrop", "promo", "telegram", "signals", "click here"];
        const textLower = message.text.toLowerCase();

        // Check for bot keywords
        if (botKeywords.some(kw => textLower.includes(kw))) {
            analysis.spamScore += 0.6;
        }

        // Check for shouting (All Caps)
        if (message.text === message.text.toUpperCase() && message.text.length > 5) {
            analysis.spamScore += 0.3;
        }

        // Check account age (if available)
        if (message.accountAgeDays !== undefined && message.accountAgeDays < 1) {
            analysis.spamScore += 0.5;
        }

        if (analysis.spamScore > 0.8) {
            analysis.isBot = true;
        }

        // 2. Sentiment Analysis (Only for non-bots)
        if (!analysis.isBot) {
            const positiveWords = ["lfg", "w", "bagged", "bought", "moon", "love", "huge", "bullish"];
            const negativeWords = ["l", "scam", "rug", "sell", "boring", "bearish", "fud"];

            let score = 0;
            positiveWords.forEach(w => { if (textLower.includes(w)) score += 0.5; });
            negativeWords.forEach(w => { if (textLower.includes(w)) score -= 0.5; });

            // Clamp score between -1 and 1
            analysis.sentimentScore = Math.max(-1, Math.min(1, score));
        }

        return {
            ...message,
            analysis
        };
    }

    /**
     * Aggregate messages into a time window to calculate Hype Score
     */
    processWindow(messages: ChatMessage[], windowStart: Date, durationMinutes: number): SentimentWindow {
        const analyzedMessages = messages.map(m => this.analyzeMessage(m));

        const totalMessages = analyzedMessages.length;
        const bots = analyzedMessages.filter(m => m.analysis?.isBot);
        const genuine = analyzedMessages.filter(m => !m.analysis?.isBot);

        const totalSentiment = genuine.reduce((sum, m) => sum + (m.analysis?.sentimentScore || 0), 0);
        const avgSentiment = genuine.length > 0 ? totalSentiment / genuine.length : 0;


        // Hype Score Calculation:
        // Volume of Genuine Messages * Sentiment Intensity
        // Normalized to 0-100 scale (arbitrary heuristic for prototype)
        let hypeScore = (genuine.length * (1 + avgSentiment)) * 2;
        hypeScore = Math.min(100, Math.max(0, hypeScore));

        // Calculate Velocity & Acceleration (Mocking previous state for this prototype)
        // In a real app, we would pass the `previousWindow` as an argument
        const mockPreviousSentiment = avgSentiment * 0.8; // Assume it was lower before (rising)
        const mockPrevPrevSentiment = avgSentiment * 0.5;

        const velocity = (avgSentiment - mockPreviousSentiment); // dS/dt
        const prevVelocity = (mockPreviousSentiment - mockPrevPrevSentiment);
        const acceleration = (velocity - prevVelocity); // d2S/dt2

        return {
            timestamp: windowStart,
            durationMinutes,
            totalMessages,
            botCount: bots.length,
            genuineCount: genuine.length,
            averageSentiment: avgSentiment,
            sentimentVelocity: velocity,
            sentimentAcceleration: acceleration,
            hypeScore,
            topKeywords: [] // TODO: Implement keyword extraction
        };
    }
}
