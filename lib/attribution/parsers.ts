/**
 * Attribution Parsers
 *
 * Regex-based parsers for extracting cashtags, hashtags, and other
 * attribution signals from content text.
 */

import type { ConfidenceLevel } from './types';

/**
 * Parse cashtags from text (e.g., $WOLF, $DTV, $BIRDIE)
 *
 * Cashtags are the strongest signal (100% confidence) that content
 * is about a specific token.
 *
 * Rules:
 * - Must start with $
 * - Followed by 1-10 uppercase letters/numbers
 * - Must have word boundary after (not $WOLF123token)
 *
 * @example
 * parseCashtags("Just bought more $WOLF! Also loving $DTV")
 * // Returns: ["$WOLF", "$DTV"]
 */
export function parseCashtags(text: string): string[] {
  if (!text) return [];

  // Match $SYMBOL with word boundary
  // Allows: $WOLF, $DTV, $BIRDIE, $BTC, $ETH
  // Rejects: $, $a, $VERYLONGTICKERNAME
  const cashtagRegex = /\$([A-Z][A-Z0-9]{0,9})\b/g;

  const matches = text.match(cashtagRegex);
  if (!matches) return [];

  // Deduplicate and return
  return [...new Set(matches)];
}

/**
 * Parse hashtags from text (e.g., #WOLF, #WolfToken, #DTV)
 *
 * Hashtags are a strong signal (90% confidence) that content
 * is about a specific project.
 *
 * Rules:
 * - Must start with #
 * - Followed by 1-30 letters/numbers/underscores
 * - First character after # must be a letter
 * - Must have word boundary after
 *
 * @example
 * parseHashtags("Big news for #WOLF community! #WolfToken #LFG")
 * // Returns: ["#WOLF", "#WolfToken", "#LFG"]
 */
export function parseHashtags(text: string): string[] {
  if (!text) return [];

  // Match #hashtag with word boundary
  // Allows: #WOLF, #WolfToken, #Wolf_Token, #DTV2024
  // Rejects: #, #123, #_test
  const hashtagRegex = /#([A-Za-z][A-Za-z0-9_]{0,29})\b/gi;

  const matches = text.match(hashtagRegex);
  if (!matches) return [];

  // Deduplicate and return (case-insensitive)
  const uniqueHashtags = new Set(
    matches.map(tag => tag.toLowerCase())
  );

  return [...uniqueHashtags];
}

/**
 * Check if text contains a project name mention (case-insensitive)
 *
 * This is a weak signal (50% confidence) because "wolf" could refer
 * to many things. Only used for manual review.
 *
 * @example
 * containsProjectName("My wolf project is doing great", "wolf")
 * // Returns: true
 *
 * containsProjectName("I saw a wolf at the zoo", "wolf")
 * // Returns: true (requires manual review to disambiguate)
 */
export function containsProjectName(text: string, projectName: string): boolean {
  if (!text || !projectName) return false;

  // Case-insensitive word boundary match
  const nameRegex = new RegExp(`\\b${escapeRegex(projectName)}\\b`, 'gi');
  return nameRegex.test(text);
}

/**
 * Check if text contains any of the project's keywords
 *
 * Keywords can be cashtags, hashtags, or project names.
 * Returns the matched keywords with their confidence levels.
 *
 * @example
 * matchKeywords("Love $WOLF and #WolfToken!", ["$WOLF", "#WOLF", "#WolfToken", "wolf token"])
 * // Returns: {
 * //   cashtags: ["$WOLF"],
 * //   hashtags: ["#WolfToken"],
 * //   names: [],
 * //   highestConfidence: 1.00
 * // }
 */
export function matchKeywords(text: string, keywords: string[]): {
  cashtags: string[];
  hashtags: string[];
  names: string[];
  highestConfidence: ConfidenceLevel;
} {
  if (!text || !keywords || keywords.length === 0) {
    return { cashtags: [], hashtags: [], names: [], highestConfidence: 0.00 };
  }

  const cashtags: string[] = [];
  const hashtags: string[] = [];
  const names: string[] = [];

  // Parse all cashtags and hashtags from text
  const textCashtags = parseCashtags(text);
  const textHashtags = parseHashtags(text);

  // Check which keywords match
  for (const keyword of keywords) {
    const normalizedKeyword = keyword.trim();

    // Check cashtags (case-insensitive)
    if (normalizedKeyword.startsWith('$')) {
      const matchFound = textCashtags.some(
        tag => tag.toLowerCase() === normalizedKeyword.toLowerCase()
      );
      if (matchFound) {
        cashtags.push(normalizedKeyword);
      }
    }
    // Check hashtags (case-insensitive)
    else if (normalizedKeyword.startsWith('#')) {
      const matchFound = textHashtags.some(
        tag => tag.toLowerCase() === normalizedKeyword.toLowerCase()
      );
      if (matchFound) {
        hashtags.push(normalizedKeyword);
      }
    }
    // Check project names (case-insensitive word boundary)
    else {
      if (containsProjectName(text, normalizedKeyword)) {
        names.push(normalizedKeyword);
      }
    }
  }

  // Determine highest confidence based on matches
  let highestConfidence: ConfidenceLevel = 0.00;

  if (cashtags.length > 0) {
    highestConfidence = 1.00; // Cashtag = 100% confidence
  } else if (hashtags.length > 0) {
    highestConfidence = 0.90; // Hashtag = 90% confidence
  } else if (names.length > 0) {
    highestConfidence = 0.50; // Name mention = 50% confidence
  }

  return {
    cashtags,
    hashtags,
    names,
    highestConfidence,
  };
}

/**
 * Extract all attribution signals from content text
 *
 * Returns a comprehensive analysis of all cashtags, hashtags,
 * and potential project mentions in the text.
 *
 * @example
 * extractSignals("Big news for $WOLF holders! #WolfToken #LFG 🚀")
 * // Returns: {
 * //   cashtags: ["$WOLF"],
 * //   hashtags: ["#wolftoken", "#lfg"],
 * //   hasExplicitSignal: true
 * // }
 */
export function extractSignals(text: string): {
  cashtags: string[];
  hashtags: string[];
  hasExplicitSignal: boolean; // True if has cashtag or hashtag
} {
  const cashtags = parseCashtags(text);
  const hashtags = parseHashtags(text);

  return {
    cashtags,
    hashtags,
    hasExplicitSignal: cashtags.length > 0 || hashtags.length > 0,
  };
}

/**
 * Helper: Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Normalize token symbol for comparison
 *
 * Removes $, #, and normalizes case for comparison.
 *
 * @example
 * normalizeSymbol("$WOLF") // Returns: "wolf"
 * normalizeSymbol("#WolfToken") // Returns: "wolftoken"
 * normalizeSymbol("WOLF") // Returns: "wolf"
 */
export function normalizeSymbol(symbol: string): string {
  return symbol.replace(/^[$#]/, '').toLowerCase();
}

/**
 * Check if a cashtag/hashtag matches a project's token symbol
 *
 * Handles variations like:
 * - $WOLF matches symbol "WOLF"
 * - #WOLF matches symbol "WOLF"
 * - #WolfToken matches symbol "WOLF" + "Token"
 *
 * @example
 * matchesTokenSymbol("$WOLF", "WOLF") // Returns: true
 * matchesTokenSymbol("#WolfToken", "WOLF") // Returns: true
 * matchesTokenSymbol("$BIRDIE", "WOLF") // Returns: false
 */
export function matchesTokenSymbol(tag: string, tokenSymbol: string): boolean {
  if (!tag || !tokenSymbol) return false;

  const normalizedTag = normalizeSymbol(tag);
  const normalizedSymbol = tokenSymbol.toLowerCase();

  // Exact match: $WOLF === WOLF
  if (normalizedTag === normalizedSymbol) return true;

  // Suffix match: #WolfToken contains WOLF
  if (normalizedTag.includes(normalizedSymbol)) return true;

  return false;
}
