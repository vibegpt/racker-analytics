# Racker Analytics - Database Schema

## Overview

This Prisma schema is designed to power the **Racker Analytics** platform - a smart link tracking system that correlates social media content with actual revenue.

---

## Core Concepts

### The Attribution Flow

```
1. Creator posts content on Twitter/YouTube/etc with a Smart Link
2. Fan clicks the Smart Link → Click is tracked (IP, location, timestamp)
3. Fan makes a purchase → Sale is recorded (Stripe webhook)
4. Attribution Engine matches Click → Sale based on:
   - IP address match
   - Geographic location match
   - Time window (click within X hours of sale)
   - Email match (if available)
5. Creator sees which posts drove real revenue
```

---

## Models

### 👤 User & Authentication
- **User**: Core user account (synced with Clerk)
- **Subscription**: Billing tier (Hustler/Creator/Empire)
- **Team**: For Empire tier (team collaboration)
- **TeamMember**: Team membership & roles

### 🔗 Smart Links (The Core Feature)
- **SmartLink**: Trackable URLs with platform tags
  - `slug`: The short code (e.g., `crtr.fy/abc123`)
  - `originalUrl`: Destination (Stripe, Patreon, etc.)
  - `platform`: Which social platform it's for
  - `active`: Can be turned on/off

### 👆 Click Tracking
- **Click**: Every click on a smart link
  - Timestamp, IP address, user agent
  - Geo data (country, city, lat/lon)
  - Device info (mobile/desktop, browser, OS)
  - UTM parameters (if present)

### 💰 Sales (Stripe Integration)
- **Sale**: Revenue events from Stripe
  - Payment intent ID
  - Amount, currency, status
  - Customer info (email, IP, location)
  - Product name & metadata

### 🎯 Attribution (The Magic!)
- **Attribution**: Links clicks to sales
  - Confidence score (0.0 - 1.0)
  - Status (pending, matched, confirmed, rejected)
  - Time delta (minutes between click and sale)
  - `matchedBy`: JSON showing which factors matched
  - Revenue share (for multi-touch attribution)

### 📱 Social Accounts
- **SocialAccount**: OAuth connections to social platforms
  - Platform (Twitter, YouTube, Instagram, TikTok, Twitch)
  - Access/refresh tokens
  - Follower count, verified status
- **SocialPost**: Content tracking
  - Engagement metrics (likes, comments, shares, views)
  - Sentiment analysis (Creator tier+)
  - Hype score

### 🔑 API Keys & Settings
- **ApiKey**: For programmatic access
- **DailyStats**: Aggregated daily analytics

---

## Key Relationships

```mermaid
graph TD
    User --> SmartLink
    User --> Sale
    SmartLink --> Click
    Click --> Attribution
    Sale --> Attribution
    User --> SocialAccount
    SocialAccount --> SocialPost
    User --> Subscription
```

---

## Attribution Algorithm

The **Attribution Engine** uses multiple signals to match clicks to sales:

### Matching Factors (scored 0.0 - 1.0)

1. **IP Address Match** (0.4 weight)
   - Exact match = 1.0
   - Same /24 subnet = 0.7
   - Same country = 0.3

2. **Geographic Match** (0.2 weight)
   - Same city = 1.0
   - Same region = 0.7
   - Same country = 0.5

3. **Time Window** (0.3 weight)
   - < 5 minutes = 1.0
   - < 30 minutes = 0.8
   - < 2 hours = 0.6
   - < 24 hours = 0.4
   - > 24 hours = 0.1

4. **Email Match** (0.1 weight)
   - Exact match = 1.0 (if available from Stripe metadata)

### Confidence Score

```
confidenceScore = (ipScore * 0.4) + (geoScore * 0.2) + (timeScore * 0.3) + (emailScore * 0.1)
```

### Status Transitions

- **confidenceScore >= 0.8** → `MATCHED` (auto-approve)
- **0.5 <= confidenceScore < 0.8** → `UNCERTAIN` (needs review)
- **confidenceScore < 0.5** → `REJECTED` (too low confidence)

---

## Indexes

The schema includes strategic indexes for:
- Fast lookups by `slug` (smart link redirects)
- Attribution matching (IP address, location, timestamp)
- Analytics queries (date ranges, user stats)
- OAuth connections (platform + user)

---

## Setup Instructions

### 1. Install Prisma

```bash
npm install prisma --save-dev
npm install @prisma/client
```

### 2. Set up environment variables

Create a `.env` file:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/racker_analytics?schema=public"
```

For Supabase:
```env
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
```

### 3. Run migrations

```bash
npx prisma migrate dev --name init
```

### 4. Generate Prisma Client

```bash
npx prisma generate
```

### 5. Seed data (optional)

```bash
npx prisma db seed
```

---

## Example Queries

### Create a smart link
```typescript
const link = await prisma.smartLink.create({
  data: {
    userId: user.id,
    slug: 'tweet-product-launch',
    originalUrl: 'https://buy.stripe.com/...',
    platform: 'TWITTER',
    metaTitle: 'Check out my new product!',
    active: true
  }
});
```

### Track a click
```typescript
const click = await prisma.click.create({
  data: {
    linkId: link.id,
    ipAddress: req.headers['x-forwarded-for'],
    userAgent: req.headers['user-agent'],
    country: 'US',
    city: 'San Francisco',
    deviceType: 'mobile'
  }
});
```

### Record a sale (from Stripe webhook)
```typescript
const sale = await prisma.sale.create({
  data: {
    userId: user.id,
    stripePaymentIntentId: event.data.object.id,
    amount: event.data.object.amount,
    currency: event.data.object.currency,
    status: 'succeeded',
    customerEmail: event.data.object.receipt_email,
    customerIp: event.data.object.charges.data[0]?.billing_details?.address?.country
  }
});
```

### Find attributions
```typescript
const attributions = await prisma.attribution.findMany({
  where: {
    userId: user.id,
    status: 'MATCHED',
    confidenceScore: { gte: 0.8 }
  },
  include: {
    click: { include: { link: true } },
    sale: true
  },
  orderBy: { createdAt: 'desc' }
});
```

---

## Subscription Tiers

| Tier | Price | Features |
|------|-------|----------|
| **Hustler** | Free | Unlimited smart links, Stripe integration, basic analytics |
| **Creator** | $29/mo | + Sentiment analysis, advanced correlation, all platforms |
| **Empire** | $299/mo | + White label, team seats, priority support |

Check the `Subscription` model and `SubscriptionTier` enum for implementation.

---

## Next Steps

1. ✅ Schema is defined
2. ⏳ Run `npx prisma migrate dev`
3. ⏳ Build the Attribution Engine (lib/attribution/engine.ts)
4. ⏳ Set up Stripe webhooks
5. ⏳ Build the onboarding flow

---

## Questions?

This schema is designed to scale from MVP to 10,000+ creators. It supports:
- Multi-touch attribution (revenue splitting)
- Team collaboration (Empire tier)
- All major social platforms
- Real-time tracking with fast indexes

Need to modify something? The Prisma schema is easy to evolve with migrations!
