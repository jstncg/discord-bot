// src/util/severity.js
export const PRIORITY = {
  megablunder: 0,
  blunder: 1,
  mistake: 2,
  inaccuracy: 3,
  interesting: 4,
  good: 5,
  great: 6,
  excellent: 7,
  brilliant: 8,
  superbrilliant: 9,
};

export function worseLabel(a, b) {
  // return the more severe (lower priority number = worse performance)
  return (PRIORITY[a] ?? 4) <= (PRIORITY[b] ?? 4) ? a : b;
}

// Testing checklist:
// - Ensure megablunder has highest severity (0) and superbrilliant has lowest (9)
// - worseLabel('blunder', 'great') should return 'blunder'
// - worseLabel with undefined labels should default to priority 4 (interesting)
