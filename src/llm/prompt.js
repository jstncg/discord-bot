// src/llm/prompt.js
import { LABEL_ORDER } from '../util/labels.js';

export function systemPrompt(lang = 'en') {
  return [
    'You are "Game Review" for chat screenshots.',
    'Perform OCR + analysis in one pass using the images provided.',
    'Return STRICT JSON only (no prose, no markdown).',
    'For EACH message bubble, output: index (reading order), side (sender|receiver), text, bbox [x,y,w,h] in pixels of the ORIGINAL image, label, confidence.',
    `Valid labels (ordered strength): ${LABEL_ORDER.join(', ')}`,
    'Also return summary_line (one witty but safe line), counts per label, ending, and overall elo.',
    'If unsure about a bbox, estimate; do NOT omit.',
    `Language: ${lang}.`,
  ].join('\n');
}

export function userPrompt({ imageUrls }) {
  return [
    'TASK:',
    '- Infer who is sender vs receiver by typical chat layout.',
    '- BBoxes must be TIGHT rectangles around each bubble.',
    '- If multiple images are sent, include image_index for each message (0-based).',
    '- Keep reasons internal; only the fields specified should appear.',
    'Return ONLY JSON.',
    'IMAGES:',
    ...imageUrls
  ].join('\n');
}
