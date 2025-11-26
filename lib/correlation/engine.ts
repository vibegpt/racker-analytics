import { RevenueEvent, RevenueCorrelation, CorrelatedContent } from "./types";
import { AttributedContent } from "../attribution/types";
import { MOCK_LINK_CLICKS, MOCK_SMART_LINKS } from "../links/mock-data";

export class CorrelationEngine {
    private windowMinutes: number;

    constructor(windowMinutes: number = 24 * 60) { // Default 24 hour window
        this.windowMinutes = windowMinutes;
    }

    /**
     * Correlate a single revenue event with a list of content
     */
    correlateEvent(
        event: RevenueEvent,
        contentHistory: AttributedContent[]
    ): RevenueCorrelation {
        const eventTime = event.timestamp.getTime();
        const windowMs = this.windowMinutes * 60 * 1000;

        // 1. Check for Smart Link "Hard Match" (100% Confidence)
        const linkedClick = MOCK_LINK_CLICKS.find(c => c.revenueEventId === event.id);

        if (linkedClick) {
            const smartLink = MOCK_SMART_LINKS.find(l => l.id === linkedClick.linkId);

            // Find content that likely contained this link (same platform, posted before click)
            // In a real app, we'd store "contentId" on the SmartLink if it was auto-generated for a specific post
            const matchingContent = contentHistory.find(c => {
                // Simple heuristic: Platform matches & posted before click
                const platformMatch = c.socialAccountId.includes(smartLink?.platform || '');
                const timeMatch = c.postedAt.getTime() < linkedClick.timestamp.getTime();
                return platformMatch && timeMatch;
            });

            if (matchingContent) {
                return {
                    revenueEventId: event.id,
                    revenueEvent: event,
                    attributedContent: [{
                        content: matchingContent,
                        timeDifferenceMinutes: Math.round((eventTime - matchingContent.postedAt.getTime()) / 60000),
                        correlationScore: 1.0, // Perfect score
                        locationMatch: true, // Implicitly true if click tracked
                        smartLinkMatch: {
                            linkId: smartLink!.id,
                            clickId: linkedClick.id,
                            platform: smartLink!.platform
                        }
                    }],
                    primaryAttribution: {
                        content: matchingContent,
                        timeDifferenceMinutes: Math.round((eventTime - matchingContent.postedAt.getTime()) / 60000),
                        correlationScore: 1.0,
                        locationMatch: true,
                        smartLinkMatch: {
                            linkId: smartLink!.id,
                            clickId: linkedClick.id,
                            platform: smartLink!.platform
                        }
                    }
                };
            }
        }


        // 2. Fallback to Time & Location Matching (Soft Match)
        // Find content posted BEFORE the revenue event, within the window
        const candidates = contentHistory.filter(content => {
            const contentTime = content.postedAt.getTime();
            return contentTime < eventTime && contentTime > (eventTime - windowMs);
        });

        const attributedContent = candidates.map(content => {
            const diffMs = eventTime - content.postedAt.getTime();
            const diffHours = diffMs / (1000 * 60 * 60);

            // --- 1. Exponential Time Decay (Ad Tech) ---
            // λ (lambda) tuning based on platform
            let lambda = 0.5; // Default (Twitter-like)
            if (content.contentType === 'video') lambda = 0.1; // YouTube (Long tail)
            if (content.contentType === 'stream') lambda = 2.0; // Live (Immediate)

            const timeScore = Math.exp(-lambda * diffHours);

            // --- 2. Geo-Overlap Jaccard Index (Epidemiology) ---
            let geoScore = 0;
            if (event.location && content.audienceBreakdown) {
                const buyerCity = event.location.city;
                const match = content.audienceBreakdown.find(l => l.city === buyerCity);

                if (match) {
                    // Jaccard-ish: Overlap / Union (Simplified for prototype)
                    // If 20% of viewers are from London, and buyer is from London -> 0.2
                    // We boost this raw probability to make it a score (0-1)
                    // Heuristic: If > 10% match, it's a strong signal.
                    geoScore = Math.min(1.0, match.percentage * 5);
                }
            }

            // --- 3. Sentiment Velocity (Finance) ---
            // (Mocking sentiment score for content here, in reality we'd look up the SentimentWindow)
            const sentimentScore = 0.5; // Placeholder for positive sentiment

            // --- 4. Ensemble Scoring (Credit Scoring) ---
            // Weighted Sum
            const w1 = 0.5; // Time
            const w2 = 0.3; // Geo
            const w3 = 0.2; // Sentiment

            const finalScore = (w1 * timeScore) + (w2 * geoScore) + (w3 * sentimentScore);

            return {
                content,
                timeDifferenceMinutes: Math.round(diffMs / 60000),
                correlationScore: Math.max(0, Math.min(1, finalScore)),
                locationMatch: geoScore > 0.1,
                smartLinkMatch: undefined
            };
        });

        // Sort by score
        attributedContent.sort((a, b) => b.correlationScore - a.correlationScore);

        return {
            revenueEventId: event.id,
            revenueEvent: event,
            attributedContent: attributedContent,
            primaryAttribution: attributedContent.length > 0 ? attributedContent[0] : undefined
        };
    }

    /**
     * Batch correlate multiple events
     */
    batchCorrelate(
        events: RevenueEvent[],
        contentHistory: AttributedContent[]
    ): RevenueCorrelation[] {
        return events.map(event => this.correlateEvent(event, contentHistory));
    }
}
