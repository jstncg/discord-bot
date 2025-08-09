// src/schema/review.js
import { z } from 'zod';

export const Label = z.enum([
  'superbrilliant','brilliant','excellent','great','good',
  'interesting','inaccuracy','mistake','blunder','megablunder'
]);

export const MessageOut = z.object({
  index: z.number().int().nonnegative(),
  side: z.enum(['sender','receiver','unknown']).default('unknown'),
  text: z.string().min(1).max(2000),
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]), // [x,y,w,h]
  image_index: z.number().int().nonnegative().default(0).optional(),
  label: Label,
  confidence: z.number().min(0).max(1).default(0.7)
});

export const ReviewOut = z.object({
  summary_line: z.string().min(3).max(200),
  elo: z.number().int().min(0).max(3500),
  ending: z.string().min(2).max(40),
  messages: z.array(MessageOut).min(1).max(300),
  counts: z.record(z.string(), z.number()).default({})
});

export function safeParseReview(s) {
  try { return { ok: true, data: ReviewOut.parse(s) }; }
  catch (e) { return { ok: false, error: e }; }
}

/** Example object to show the model the expected structure */
export const ExampleReview = {
  version: '1.0',
  language: 'en',
  conversation: {
    title: 'Coffee Date Setup',
    messages: [
      { index: 0, side: 'sender', text: "hey, loved your travel pics :)" },
      { index: 1, side: 'receiver', text: "aww thanks! where was your last trip?" },
    ],
  },
  analysis: {
    summary_line: "Solid positional play with a clever gambit: quick compliment then invite.",
    elo_estimate: 1410,
    ending: 'swipe_right',
    notes: ["Tone warm, concise asks convert better."],
    moves: [
      {
        index: 0,
        label: 'brilliant',
        reason: "Opens with specific compliment; low cringe, high personalization.",
        confidence: 0.86,
      },
      {
        index: 1,
        label: 'excellent',
        reason: "Keeps momentum, invites deeper convo without pressure.",
        confidence: 0.78,
      },
    ],
  },
};
