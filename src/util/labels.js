// src/util/labels.js - Updated to match perfect circular badge style
export const LABELS = /** @type {const} */ ({
  superbrilliant: { emoji: '🚀', color: '#8B5CF6' },
  brilliant:      { emoji: '💎', color: '#3B82F6' },
  excellent:      { emoji: '⭐', color: '#F59E0B' },
  great:          { emoji: '✅', color: '#10B981' },
  good:           { emoji: '👍', color: '#6B7280' },
  interesting:    { emoji: '📖', color: '#D2691E' },  // Book emoji with tan/brown like your image
  inaccuracy:     { emoji: '🤔', color: '#F97316' },
  mistake:        { emoji: '😅', color: '#FB923C' },
  blunder:        { emoji: '😬', color: '#EF4444' },
  megablunder:    { emoji: '❓', color: '#991B1B' }   // Question mark with dark red like your image
});

export const LABEL_ORDER = Object.keys(LABELS);

export function hexToInt(hex) {
  return parseInt(hex.replace('#',''), 16);
}

