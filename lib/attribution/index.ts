/**
 * Attribution System
 *
 * Exports all attribution-related functionality.
 *
 * @example
 * ```typescript
 * import { AttributionEngine, saveAttribution } from '@/lib/attribution';
 *
 * const engine = new AttributionEngine();
 * const results = await engine.attributeContent(content, projects, socialLinks);
 * await saveAttribution(results[0]);
 * ```
 */

// Core engine
export { AttributionEngine, createAttributionEngine, getConfidenceLabel, getReasonLabel } from './engine';

// Adaptive Attribution Service (connects Track API ↔ Stripe ↔ Adaptive Engine)
export { 
  attributeSale,
  processAttributionFeedback,
  getModelStatus,
  getAdaptiveEngine,
  type AttributionResult as SaleAttributionResult
} from './attribution-service';

// Parsers
export {
  parseCashtags,
  parseHashtags,
  matchKeywords,
  extractSignals,
  containsProjectName,
  matchesTokenSymbol,
  normalizeSymbol,
} from './parsers';

// Database operations
export {
  saveAttribution,
  batchSaveAttributions,
  getProjectAttributions,
  getManualReviewQueue,
  approveAttribution,
  rejectAttribution,
  getAttributionStats,
  deleteAttribution,
  isContentAttributed,
  getUserRecentAttributions,
  prisma,
} from './db';

// Types
export type {
  Platform,
  ContentType,
  AttributionMode,
  AttributionReason,
  ConfidenceLevel,
  RawContent,
  Project,
  ProjectSocialLink,
  MatchResult,
  AttributionResult,
  AttributedContent,
  PlatformRule,
  AttributionConfig,
} from './types';
