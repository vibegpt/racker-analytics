/**
 * Insights Engine State API
 *
 * GET /api/insights/state - Get current engine state and learning progress
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getInsightsEngine } from '@/lib/insights';

export async function GET(request: NextRequest) {
  try {
    // Optional auth check - could be made admin-only
    const { userId: clerkId } = await auth();

    const engine = getInsightsEngine();
    const state = engine.getState();
    const weights = engine.getWeights();

    // Calculate learning progress
    const minSamples = 50; // DEFAULT_LEARNING_CONFIG.minSamplesBeforeLearning
    const learningProgress = Math.min(100, (state.eventCount / minSamples) * 100);

    // Determine learning stage
    let learningStage: string;
    if (state.eventCount < 10) {
      learningStage = 'Initializing - Collecting baseline data';
    } else if (state.eventCount < 25) {
      learningStage = 'Early Data - Patterns starting to emerge';
    } else if (state.eventCount < 50) {
      learningStage = 'Pattern Recognition - Building confidence';
    } else if (state.eventCount < 100) {
      learningStage = 'Active Learning - Optimizing weights';
    } else if (state.eventCount < 200) {
      learningStage = 'Refined Model - High confidence predictions';
    } else if (state.eventCount < 500) {
      learningStage = 'Mature Model - Production-grade insights';
    } else {
      learningStage = 'Expert System - Highly optimized for your data';
    }

    // Expected accuracy based on training count
    const estimatedAccuracy = Math.min(0.95, 0.6 + (weights.trainingCount * 0.05));

    return NextResponse.json({
      success: true,
      state: {
        ...state,
        learningProgress,
        learningStage,
        estimatedAccuracy,
      },
      weights: {
        version: weights.version,
        trainingCount: weights.trainingCount,
        lastUpdated: weights.updatedAt,
        features: {
          time: { weight: weights.timeWeight, description: 'Time of day/week importance' },
          platform: { weight: weights.platformWeight, description: 'Platform performance variance' },
          niche: { weight: weights.nicheWeight, description: 'Creator niche impact' },
          geo: { weight: weights.geoWeight, description: 'Geographic correlation' },
          content: { weight: weights.contentWeight, description: 'Content type influence' },
        },
        platformDecayRates: weights.platformLambdas,
      },
      tips: getLearningTips(state.eventCount, state.isLearning),
    });

  } catch (error) {
    console.error('[Insights State API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get engine state' },
      { status: 500 }
    );
  }
}

function getLearningTips(eventCount: number, isLearning: boolean): string[] {
  const tips: string[] = [];

  if (eventCount < 50) {
    tips.push(`Need ${50 - eventCount} more clicks to start adaptive learning`);
    tips.push('Use Smart Links consistently to build training data');
  }

  if (!isLearning) {
    tips.push('Engine is using domain-expert defaults until enough data is collected');
  } else {
    tips.push('Engine is actively learning from your conversion data');
  }

  if (eventCount < 100) {
    tips.push('Insights will improve significantly after 100+ tracked events');
  }

  if (eventCount >= 100) {
    tips.push('Your model has reached production-grade confidence');
  }

  return tips;
}
