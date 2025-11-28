# Rackr.co Platform Summary

## What is Rackr?

Rackr is a **creator-focused link tracking and attribution platform** designed for influencers, content creators, and affiliate marketers. It helps creators understand which content drives conversions and optimize their monetization strategy.

---

## Core Problem We Solve

Creators today have no idea which posts, platforms, or content actually generates their affiliate revenue. They share links across Instagram, YouTube, TikTok, Twitter, and newsletters - but when a sale happens, they can't attribute it back to the specific content that drove it.

**Rackr connects the dots** between content and conversions.

---

## Key Features

### 1. Smart Links
- **Short URLs**: `rackr.co/your-slug` redirects to any destination
- **Geo-Routing**: Automatically redirect users to region-specific affiliate links (e.g., US users to Amazon.com, UK users to Amazon.co.uk)
- **Platform Tagging**: Track which platform (Instagram, YouTube, TikTok, etc.) each link is shared on

### 2. Click Tracking & Analytics
- **Real-time click tracking** with full metadata:
  - Geographic location (country, region, city)
  - Device type (mobile, desktop, tablet)
  - Browser and OS
  - Referrer source
  - UTM parameters
- **Cross-site tracking** via URL parameters (`?rckr=trackerId`) to follow users from click to conversion

### 3. Lead & Conversion Attribution
- Track **page views** on creator landing pages
- Capture **form submissions** and lead generation
- **Revenue attribution** back to specific links and content pieces

### 4. Geo-Affiliate Routing
- Single link that automatically routes to the right regional affiliate program
- Example: Share one Amazon link that sends:
  - US visitors to amazon.com with US affiliate tag
  - UK visitors to amazon.co.uk with UK affiliate tag
  - AU visitors to amazon.com.au with AU affiliate tag

### 5. Creator Insights (Planned)
- AI-powered insights on best posting times
- Content performance patterns
- Audience behavior analysis

---

## Technical Architecture

### Stack
| Component | Technology |
|-----------|------------|
| Frontend | Next.js 15 (App Router) |
| Database | PostgreSQL via Supabase |
| ORM | Prisma |
| Auth | Clerk |
| Hosting | Vercel |
| Caching | Redis (Upstash) - optional |
| Payments | Stripe |

### Key Data Models

```
User
  - Clerk integration for auth
  - Subscription plan (FREE, CREATOR, EMPIRE)
  - Stripe customer ID

SmartLink
  - slug (unique short URL identifier)
  - originalUrl (destination)
  - platform (TWITTER, YOUTUBE, INSTAGRAM, TIKTOK, etc.)
  - routerType (STANDARD, GEO_AFFILIATE)
  - routerConfig (geo-routing rules as JSON)

Click
  - Full tracking metadata (IP, UA, geo, device, UTM)
  - routedTo (final destination URL)
  - routeMatch (which geo rule matched)

PageView / FormConversion
  - For tracking on-site behavior after click
  - Links back to original SmartLink for attribution

CreatorProfile
  - Niche, country, audience demographics
  - Used for insights and benchmarking
```

### API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /[slug]` | Short URL redirect (public) |
| `GET /api/track/[slug]` | Click tracking API |
| `GET/POST /api/links` | CRUD for smart links |
| `POST /api/t/pageview` | Track page views |
| `POST /api/t/form` | Track form conversions |
| `GET /api/health` | System health check |

---

## How It Works

### Link Tracking Flow

```
1. Creator creates link in dashboard
   POST /api/links
   { originalUrl: "https://amazon.com/product", platform: "instagram", customSlug: "my-product" }

2. Creator shares rackr.co/my-product on Instagram

3. Fan clicks the link
   GET rackr.co/my-product

4. Rackr logs the click with full metadata
   - IP geolocation
   - Device/browser detection
   - UTM parameter capture

5. User is redirected to destination with tracking params
   https://amazon.com/product?rckr=tracker123&rckr_link=link456

6. If creator has Rackr tracking script on their site:
   - Page views are tracked
   - Form submissions are attributed
   - Revenue can be linked back to specific content
```

### Geo-Routing Flow

```
1. Creator creates geo-routed link
   {
     originalUrl: "https://amazon.com/product?tag=us-affiliate",
     routerType: "GEO_AFFILIATE",
     geoRoutes: [
       { country: "GB", url: "https://amazon.co.uk/product?tag=uk-affiliate" },
       { country: "AU", url: "https://amazon.com.au/product?tag=au-affiliate" }
     ]
   }

2. US visitor clicks: -> amazon.com with US tag
3. UK visitor clicks: -> amazon.co.uk with UK tag
4. AU visitor clicks: -> amazon.com.au with AU tag
5. Other countries: -> default URL (amazon.com)
```

---

## Pricing Plans (Planned)

| Plan | Price | Links | Clicks/mo | Features |
|------|-------|-------|-----------|----------|
| **Free** | $0 | 10 | 1,000 | Basic tracking |
| **Creator** | $19/mo | 100 | 50,000 | Geo-routing, Analytics |
| **Empire** | $49/mo | Unlimited | Unlimited | API access, Team, Priority |

---

## Roadmap

### Phase 1: Core Platform (Current)
- [x] Smart link creation and management
- [x] Click tracking with full metadata
- [x] Geo-affiliate routing
- [x] User authentication (Clerk)
- [x] Database setup (Supabase)
- [ ] Dashboard UI for link management
- [ ] Click analytics dashboard

### Phase 2: Attribution & Insights
- [ ] On-site tracking script (track.js)
- [ ] Form conversion tracking
- [ ] Revenue attribution
- [ ] Creator insights engine
- [ ] Best posting time recommendations

### Phase 3: Monetization
- [ ] Stripe subscription integration
- [ ] Usage-based billing
- [ ] Team/agency accounts
- [ ] White-label options

### Phase 4: Advanced Features
- [ ] API for programmatic link creation
- [ ] Webhook notifications
- [ ] Integrations (Shopify, affiliate networks)
- [ ] Mobile app

---

## Competitive Advantages

1. **Creator-First Design**: Built specifically for influencers, not generic marketers
2. **Geo-Routing Built In**: No complex setup for international affiliate links
3. **Full Attribution**: Track from click to conversion, not just clicks
4. **Insights Engine**: AI-powered recommendations based on aggregated creator data
5. **Modern Stack**: Fast, serverless, scales automatically

---

## Key URLs

- **Production**: https://racker-analytics.vercel.app
- **Short Links**: rackr.co/[slug] (once custom domain configured)
- **GitHub**: https://github.com/vibegpt/racker-analytics

---

## Environment Variables Required

```env
# Database
DATABASE_URL=postgresql://...@supabase.com:5432/postgres

# Auth (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# App
NEXT_PUBLIC_APP_URL=https://rackr.co
NEXT_PUBLIC_SHORT_DOMAIN=rackr.co

# Optional
UPSTASH_REDIS_URL=redis://...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## Summary

Rackr transforms how creators understand their content's impact. By providing smart link tracking, geo-routing, and full attribution, we help creators maximize their affiliate revenue and make data-driven content decisions.

**One link. Every region. Full attribution.**
