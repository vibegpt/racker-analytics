
import { AttributedContent } from "../attribution/types";

export type RevenueSource = 'stripe' | 'patreon' | 'amazon' | 'shopify';

export interface LocationData {
    city: string;
    country: string;
}

export interface RevenueEvent {
    id: string;
    source: RevenueSource;
    amount: number;
    currency: string;
    timestamp: Date;
    description: string;
    customerEmail?: string;
    location?: LocationData;
    metadata?: Record<string, any>;
}

export interface CorrelatedContent {
    content: AttributedContent;
    timeDifferenceMinutes: number;
    correlationScore: number; // 0.0 - 1.0
    locationMatch?: boolean;
    smartLinkMatch?: {
        linkId: string;
        clickId: string;
        platform: string;
    };
}

export interface RevenueCorrelation {
    revenueEventId: string;
    revenueEvent: RevenueEvent;
    attributedContent: CorrelatedContent[];
    primaryAttribution?: CorrelatedContent; // The "winner"
}
