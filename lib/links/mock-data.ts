
import { SmartLink, LinkClick } from "./types";

const NOW = Date.now();
const HOUR = 60 * 60 * 1000;

export const MOCK_SMART_LINKS: SmartLink[] = [
    {
        id: 'link_twt_1',
        creatorId: 'creator_1',
        originalUrl: 'https://myshop.com/premium-guide',
        slug: 'guide-twt',
        platform: 'twitter',
        campaign: 'spring-launch',
        createdAt: new Date(NOW - 7 * 24 * HOUR),
        active: true,
        metaTitle: 'The Ultimate Creator Guide 2025',
        metaImage: 'https://myshop.com/img/guide.png'
    },
    {
        id: 'link_yt_1',
        creatorId: 'creator_1',
        originalUrl: 'https://myshop.com/camera-gear',
        slug: 'gear-yt',
        platform: 'youtube',
        createdAt: new Date(NOW - 30 * 24 * HOUR),
        active: true,
        metaTitle: 'My Camera Gear List',
    }
];

export const MOCK_LINK_CLICKS: LinkClick[] = [
    {
        id: 'click_1',
        linkId: 'link_twt_1',
        timestamp: new Date(NOW - 2 * HOUR - 10 * 60 * 1000), // 10 mins before rev_1
        city: 'New York',
        country: 'US',
        converted: true,
        revenueEventId: 'rev_1', // Hard link to the Stripe sale
        conversionValue: 50.00
    },
    {
        id: 'click_2',
        linkId: 'link_yt_1',
        timestamp: new Date(NOW - 24 * HOUR - 30 * 60 * 1000), // 30 mins before rev_3
        city: 'Los Angeles',
        country: 'US',
        converted: true,
        revenueEventId: 'rev_3', // Hard link to Amazon sale
        conversionValue: 120.00
    },
    {
        id: 'click_3',
        linkId: 'link_twt_1',
        timestamp: new Date(NOW - 1 * HOUR),
        city: 'London',
        country: 'UK',
        converted: false
    }
];
