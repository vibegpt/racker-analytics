
import { ChatMessage } from "./types";

const NOW = Date.now();
const MINUTE = 60 * 1000;

// Helper to generate messages
const generateMessages = (count: number, startOffsetMinutes: number, type: 'genuine' | 'bot' | 'mixed'): ChatMessage[] => {
    const messages: ChatMessage[] = [];

    const genuinePhrases = [
        "LFG!!!", "Just bought a bag", "This is huge", "W stream", "Love the energy",
        "When is the drop?", "Link?", "Can you check my wallet?", "HODL", "To the moon"
    ];

    const botPhrases = [
        "BUY FOLLOWERS CHEAP", "CLICK HERE FOR FREE AIRDROP", "BEST CRYPTO SIGNALS",
        "JOIN TELEGRAM NOW", "PROMO PROMO PROMO", "BIGGEST PUMP SIGNAL"
    ];

    for (let i = 0; i < count; i++) {
        const isBot = type === 'bot' || (type === 'mixed' && Math.random() > 0.8);
        const text = isBot
            ? botPhrases[Math.floor(Math.random() * botPhrases.length)]
            : genuinePhrases[Math.floor(Math.random() * genuinePhrases.length)];

        messages.push({
            id: `msg_${Date.now()}_${i}`,
            userId: isBot ? `bot_${i}` : `user_${i}`,
            username: isBot ? `PromoBot${i}` : `Fan${i}`,
            text: text,
            timestamp: new Date(NOW - (startOffsetMinutes * MINUTE) + (i * 1000)), // Spread out over seconds
            platform: 'twitch',
            isSubscriber: !isBot && Math.random() > 0.5,
            accountAgeDays: isBot ? 0 : Math.floor(Math.random() * 365)
        });
    }

    return messages;
};

// Scenario: 
// 1. Quiet period (30 mins ago)
// 2. Bot Raid (20 mins ago)
// 3. Genuine Hype Spike (10 mins ago) - Correlates with a Sale
export const MOCK_CHAT_HISTORY: ChatMessage[] = [
    ...generateMessages(20, 30, 'genuine'), // Quiet
    ...generateMessages(100, 20, 'bot'),    // Bot Raid (High volume, spam)
    ...generateMessages(50, 10, 'genuine'), // Hype Spike (High volume, positive)
];
