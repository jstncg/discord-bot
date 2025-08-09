// src/util/math.js
import { LABELS } from './labels.js';

// simple weights; tune later
const WEIGHTS = {
  superbrilliant: +80,
  brilliant: +60,
  excellent: +40,
  great: +25,
  good: +10,
  interesting: 0,
  inaccuracy: -10,
  mistake: -25,
  blunder: -60,
  megablunder: -90,
};

export function eloFromCounts(counts) {
  let elo = 1200;
  for (const [k, v] of Object.entries(counts || {})) {
    elo += (WEIGHTS[k] || 0) * Number(v || 0);
  }
  return Math.max(0, Math.min(3500, Math.round(elo)));
}

export function clampBBox([x,y,w,h], W, H) {
  x = Math.max(0, Math.min(x, W));
  y = Math.max(0, Math.min(y, H));
  w = Math.max(0, Math.min(w, W - x));
  h = Math.max(0, Math.min(h, H - y));
  return [Math.round(x), Math.round(y), Math.round(w), Math.round(h)];
}

