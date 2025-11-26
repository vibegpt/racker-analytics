
export type LinkPlatform = 'twitter' | 'youtube' | 'instagram' | 'tiktok' | 'twitch' | 'linkedin' | 'email' | 'other';

export interface SmartLink {
    id: string;
    creatorId: string;
    originalUrl: string;      // The destination (e.g., patreon.com/join)
    slug: string;             // The short code (e.g., crtr.fy/abc)

    platform: LinkPlatform;   // Where this specific link is shared
    campaign?: string;        // Optional campaign tag (e.g., "summer-sale")

    createdAt: Date;
    active: boolean;

    // Metadata for "Link Card" previews
    metaTitle?: string;
    metaDescription?: string;
    metaImage?: string;
}

export interface LinkClick {
    id: string;
    linkId: string;
    timestamp: Date;

    // User Identity (Fingerprinting)
    ipHash?: string;          // Anonymized IP for rough location/unique user tracking
    userAgent?: string;
    referer?: string;

    // Location Data (derived from IP)
    city?: string;
    country?: string;

    // Conversion Status
    converted: boolean;
    conversionValue?: number;
    revenueEventId?: string;  // Linked to the RevenueEvent if converted
}

export interface LinkStats {
    linkId: string;
    totalClicks: number;
    uniqueClicks: number;
    conversions: number;
    totalRevenue: number;
    conversionRate: number;

    // Time-series data for charts
    clicksOverTime: { date: string; count: number }[];
}
