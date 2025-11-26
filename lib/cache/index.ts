/**
 * Cache Module
 * 
 * Provides caching services for fast data lookups.
 */

export {
  // Types
  type CachedClick,
  
  // Core functions
  cacheClick,
  getClickById,
  
  // Lookup functions
  findClicksByIp,
  findClickByTracker,
  findClicksByFingerprint,
  findClicksByUser,
  findBestMatchForSale,
  
  // Status functions
  markClickAttributed,
  getCacheStats,
} from './click-cache';
