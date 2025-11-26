/**
 * Correlation Engine System
 * 
 * Exports all correlation-related functionality for 
 * connecting social content to revenue events.
 * 
 * @example
 * ```typescript
 * import { AdaptiveCorrelationEngine } from '@/lib/correlation';
 * 
 * const engine = new AdaptiveCorrelationEngine(24 * 60); // 24 hour window
 * const correlation = engine.correlateEvent(revenueEvent, contentHistory);
 * ```
 */

// Adaptive Correlation Engine
export { AdaptiveCorrelationEngine } from './adaptive-engine';
export type { ClickEvent } from './adaptive-engine';

// Legacy Correlation Engine
export { CorrelationEngine } from './engine';

// Types
export type {
  RevenueSource,
  LocationData,
  RevenueEvent,
  CorrelatedContent,
  RevenueCorrelation
} from './types';

// Configuration
export { 
  LearningPhase, 
  LEARNING_CONFIG,
  getPhaseBudget,
  getCurrentPhase,
  getConfidenceThreshold,
  isReadyForNextPhase
} from './learning-config';
