# Adaptive Attribution Integration

## Overview

This integration connects three key systems:
1. **Smart Link Track API** - Captures clicks with rich metadata
2. **Adaptive Correlation Engine** - Learns from ground truth to improve attribution
3. **Stripe Webhooks** - Triggers attribution when sales occur

## How It Works

### The Flow

```
[User clicks smart link] → Track API logs click
           ↓
[User makes purchase] → Stripe webhook fires
           ↓
[Attribution Service] → Matches click to sale
           ↓
[Adaptive Engine] → Records ground truth & learns
```

### Ground Truth Calibration

When a sale happens after a smart link click:
1. We know with 100% certainty the link caused the sale
2. This "ground truth" is fed to the Adaptive Engine
3. The engine learns optimal weights for time, geo, and sentiment

### Probabilistic Attribution

When a sale happens WITHOUT a smart link click:
1. We look at recent social posts
2. The Adaptive Engine calculates correlation scores
3. If confidence > 50%, we create an attribution
4. User feedback further trains the model

## Files

### `/lib/attribution/attribution-service.ts`
Main service that:
- Connects Stripe sales to clicks
- Uses Adaptive Engine for scoring
- Handles user feedback

### `/app/api/track/[slug]/route.ts`
Smart link redirect that:
- Logs click metadata (IP, geo, device)
- Caches in Redis for fast attribution lookup
- Sets tracking cookie for cross-session matching

### `/app/api/webhooks/stripe/route.ts`
Stripe webhook that:
- Handles `payment_intent.succeeded` for creator revenue
- Creates Sale record in database
- Triggers attribution via `attributeSale()`

### `/lib/correlation/adaptive-engine.ts`
ML-powered correlation engine that:
- Learns from ground truth (smart link conversions)
- Adjusts weights via gradient descent
- Provides probabilistic attribution when no link

## API Endpoints

### POST `/api/attributions/[id]/feedback`
Submit user feedback on an attribution.

```typescript
fetch(`/api/attributions/${id}/feedback`, {
  method: 'POST',
  body: JSON.stringify({ confirmed: true }) // or false to reject
})
```

### GET `/api/admin/model-status`
View current model performance.

```typescript
const status = await fetch('/api/admin/model-status').then(r => r.json());
// {
//   model: { version, accuracy, weights, ... },
//   stats: { totalAttributions7d, averageConfidence, ... },
//   recentAttributions: [...]
// }
```

## Configuration

### Attribution Window
Default: 24 hours. Change in `attribution-service.ts`:
```typescript
await attributeSale(sale, { windowMinutes: 48 * 60 }); // 48 hours
```

### Minimum Confidence
Default: 50%. Change in `attribution-service.ts`:
```typescript
await attributeSale(sale, { minConfidence: 0.7 }); // 70%
```

### Platform-Specific Decay Rates
In `adaptive-engine.ts`:
```typescript
lambdas: {
  'twitter': 0.5,   // Faster decay (impulse buys)
  'youtube': 0.1,   // Slower decay (considered purchases)
  'twitch': 2.0,    // Very fast (stream donations)
  // ...
}
```

## Stripe Setup

Add metadata to your Stripe checkout:

```typescript
const session = await stripe.checkout.sessions.create({
  // ... other options
  metadata: {
    userId: user.id,           // Required for attribution
    product_name: 'Course XYZ',
    customer_ip: request.ip    // Optional but helpful
  }
})
```

## Testing

### Simulate Attribution Flow
1. Create a smart link
2. Click it (logs to database)
3. Make a test Stripe payment with matching userId
4. Check `/api/admin/model-status` for attribution

### Check Engine State
```typescript
import { getModelStatus } from '@/lib/attribution/attribution-service';

const status = getModelStatus();
console.log('Training samples:', status.trainingDataCount);
console.log('Is learning:', status.isLearning);
console.log('Accuracy:', status.accuracy);
```

## Future Improvements

1. **Cross-device matching** - Use email or account linking
2. **Multi-touch attribution** - Split credit across multiple touches
3. **Real-time model updates** - Stream training data to dedicated service
4. **A/B testing** - Compare model versions in production
