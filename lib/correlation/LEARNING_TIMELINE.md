# Adaptive Engine: Learning Timeline

## 🎯 Quick Answer

**Data Collection**: Starts immediately (conversion #1)  
**Learning**: Starts at 50 conversions  
**Influencing Decisions**: From day 1 (but gets better over time)

---

## 📊 Detailed Timeline

```
Conversion #1-49: COLLECTING DATA
├─ Records every smart link conversion as ground truth
├─ Uses domain-expert defaults (0.5, 0.3, 0.2)
└─ Makes predictions, but doesn't adjust weights yet

Conversion #50: FIRST TRAINING
├─ Triggers batch retraining
├─ Optimizes weights using all 50 samples
├─ New weights immediately used for predictions
└─ Example: (0.5, 0.3, 0.2) → (0.52, 0.35, 0.13)

Conversion #60, #70, #80... CONTINUOUS LEARNING
├─ Retrains every 10 conversions
├─ Weights get more accurate each time
└─ Model accuracy tracked and improving

User Feedback: INSTANT LEARNING
├─ Happens at ANY time (even before 50 samples)
├─ Immediate weight adjustment via online learning
└─ Complements batch training
```

---

## 🔬 Why Wait Until 50 Samples?

### Statistical Significance

Training with too few samples causes **overfitting**:

```
❌ BAD: Training with 5 samples
Sample 1: Tweet at 2am → Sale (5 min later)
Sample 2: Tweet at 2am → Sale (3 min later)
Sample 3: Tweet at 3am → Sale (8 min later)
...

Engine learns: "Only 2am-3am tweets convert!"
Result: Ignores perfectly good daytime tweets

✅ GOOD: Training with 50+ samples
Wide variety of times, platforms, geo locations
Engine learns: "General patterns that transfer"
Result: Robust predictions
```

### The Magic Number

- **10 samples**: Too noisy, overfits
- **50 samples**: Minimum for stable patterns
- **100+ samples**: High confidence
- **500+ samples**: Production-grade

---

## 🚦 Decision-Making Timeline

### Day 1 (0 conversions)

```typescript
Sale happens (no smart link)
↓
Engine uses DEFAULTS:
  timeWeight: 0.5
  geoWeight: 0.3
  sentimentWeight: 0.2
↓
Prediction: 0.67 confidence
Attribution: "Likely from Tweet A"
```

**Impact**: Low (using industry averages, not YOUR data)

---

### Day 30 (50 conversions tracked)

```typescript
[TRAINING TRIGGERED]
Analyzing 50 ground truth samples...

Discovered patterns:
- Your geo signals are STRONGER than average
- Time decay is FASTER for your audience
- Sentiment matters LESS than expected

Old weights: (0.5, 0.3, 0.2)
New weights: (0.45, 0.42, 0.13)
Accuracy: 78%
```

**Impact**: Medium (learning YOUR audience patterns)

---

### Day 90 (200 conversions tracked)

```typescript
Model has retrained 15 times
Current accuracy: 87%

Sale happens (no smart link)
↓
Engine uses LEARNED weights:
  timeWeight: 0.48
  geoWeight: 0.39
  sentimentWeight: 0.13
↓
Prediction: 0.91 confidence
Attribution: "Very likely from Tweet B"
```

**Impact**: High (confident probabilistic attribution)

---

## ⚡ Online Learning (Instant Feedback)

Even BEFORE 50 samples, the engine can learn from user feedback:

```typescript
// Conversion #10 - engine predicts poorly
engine.correlateEvent(sale, content);
// Predicted: 0.45 for Tweet A

// User corrects it
engine.provideFeedback({
  predictedScore: 0.45,
  actualConverted: true,  // Yes, it WAS Tweet A!
  features: { ... }
});

// Weights adjust IMMEDIATELY (online learning)
// Old: (0.5, 0.3, 0.2)
// New: (0.52, 0.31, 0.17)
```

This is like having a "turbo boost" for early learning!

---

## 🎮 Configuration Options

You can tune when learning starts:

### Option 1: Conservative (Default)

```typescript
const engine = new AdaptiveCorrelationEngine();
// minTrainingSamples = 50 (safe, robust)

// Best for: Production use, high-stakes decisions
```

### Option 2: Aggressive

```typescript
const engine = new AdaptiveCorrelationEngine();
engine.minTrainingSamples = 20;  // Start learning earlier

// Best for: Testing, rapid iteration, low traffic
```

### Option 3: Immediate

```typescript
const engine = new AdaptiveCorrelationEngine();
engine.minTrainingSamples = 10;  // VERY aggressive
engine.learningRate = 0.05;      // Fast adaptation

// Best for: Demos, MVPs, experimentation
// Risk: May overfit to early data
```

---

## 📈 Real-World Example

**Creator "Sarah"** starts using Racker Analytics:

### Week 1 (5 smart link conversions)
- Engine: "Collecting data..."
- Using: Default weights
- Accuracy: ~60% (industry baseline)
- Attribution: Basic time + geo matching

### Week 2 (15 conversions)
- Engine: "Still learning patterns..."
- User provides feedback on 3 attributions
- Online learning kicks in → slight weight adjustments
- Accuracy: ~65%

### Week 4 (52 conversions) 🎉
```
[TRAINING TRIGGERED]
Discovered:
- Sarah's Instagram posts convert 2x faster than Twitter
- Geo is VERY strong signal for her audience
- Sentiment barely matters (she sells practical tools)

Weights updated:
  time: 0.42 (less important)
  geo: 0.47 (more important!)
  sentiment: 0.11 (less important)

Accuracy: 81%
```

### Week 8 (120 conversions)
- Engine has retrained 7 times
- Accuracy: 88%
- Sarah now trusts probabilistic attributions
- Optimizes content strategy based on learned patterns

---

## 🔄 The Feedback Loop

```
┌─────────────────────────────────────────┐
│  Smart Link Conversions                 │
│  (Ground Truth Data)                    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Data Collection (Starts Day 1)         │
│  • Store every conversion               │
│  • Extract features                     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Batch Training (Starts at 50 samples)  │
│  • Gradient descent optimization        │
│  • Every 10 conversions after that      │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Updated Weights → Better Predictions   │
│  • Immediate effect on next correlation │
│  • Continuously improving               │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  User Feedback (Anytime!)               │
│  • Confirm/reject attributions          │
│  • Instant online learning              │
└──────────────┬──────────────────────────┘
               │
               └──────────┐
                          │
                          ▼
                    (Repeat Loop)
```

---

## 💡 Key Insights

### 1. Progressive Learning
The engine doesn't wait idly until 50 samples. It:
- ✅ Collects data from conversion #1
- ✅ Uses sensible defaults immediately
- ✅ Starts optimizing at 50 samples
- ✅ Continuously improves thereafter

### 2. No Cliff Edge
There's no sudden switch from "dumb" to "smart" at sample 50. It's a smooth gradient:

```
Samples:    0    10    20    30    40    50    60   100   200
Accuracy: [60%] [62%] [64%] [67%] [70%] [78%] [81%] [85%] [90%]
            └────────────────────┘       └──────────────────┘
            Using defaults              Actively learning
```

### 3. Safety Mechanisms
- Weights are normalized (always sum to 1.0)
- Learning rate is conservative (0.01)
- Can't learn "negative" patterns
- Graceful fallback to defaults if training fails

---

## 🎯 TL;DR

**Q: When does it start learning?**  
**A:** Immediately collects data, starts training at 50 samples

**Q: When does it inform choices?**  
**A:** From day 1, but predictions improve dramatically after 50+ samples

**Q: Can I make it learn faster?**  
**A:** Yes - adjust `minTrainingSamples` or use online learning via user feedback

**Q: What if I have low volume?**  
**A:** Engine uses smart defaults until enough data exists. Still useful!

**Q: Will bad early data ruin the model?**  
**A:** No - waiting for 50 samples prevents overfitting to outliers

---

The adaptive engine is designed to be **safe by default** while **learning aggressively** once data permits. It's like having training wheels that automatically come off when you're ready! 🚀
