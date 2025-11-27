/**
 * Racker Insights Engine
 *
 * Adaptive learning system for link performance analytics.
 *
 * Usage:
 *
 * ```typescript
 * import { getInsightsEngine, CreatorNiche } from '@/lib/insights';
 *
 * const engine = getInsightsEngine();
 *
 * // Record a click
 * const eventId = engine.recordClick({
 *   linkId: 'link_123',
 *   platform: 'YOUTUBE',
 *   creatorNiche: 'TRAVEL',
 *   creatorCountry: 'US',
 *   clickedAt: new Date(),
 *   visitorCountry: 'UK',
 *   deviceType: 'mobile',
 *   contentType: 'video',
 * });
 *
 * // Later, record conversion
 * engine.recordConversion(eventId, 2999); // $29.99 in cents
 *
 * // Generate a creator report
 * const report = engine.generateCreatorReport('TRAVEL', 'US');
 *
 * // Generate aggregate insights
 * const aggregateReport = engine.generateAggregateReport({
 *   niche: 'TRAVEL',
 *   country: 'US',
 * });
 * ```
 */

export { InsightsEngine, getInsightsEngine, resetInsightsEngine } from './engine';

export type {
  // Enums
  CreatorNiche,
  Platform,
  InsightDimension,

  // Input types
  ClickEventInput,
  LearningConfig,

  // Pattern types
  InsightPattern,
  ModelWeights,

  // Report types
  CreatorReport,
  AggregateReport,
  AggregateQuery,
  TimeInsight,
  PlatformInsight,
  NicheInsight,
  GeoInsight,

  // State types
  EngineState,
} from './types';

export {
  DEFAULT_WEIGHTS,
  DEFAULT_LEARNING_CONFIG,
  DAYS_OF_WEEK,
  MONTHS,
} from './types';
