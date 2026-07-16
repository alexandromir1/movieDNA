/** Экономика Movie Score — Single Source of Truth из docs/03-economy.md */

export const REVEAL_REGION_COUNT = 5;

export const REVEAL_SCORE_BASE = 1000;

/** Штраф за открытие Reveal Region по displayOrder (1–5) */
export const REVEAL_PENALTIES = {
  1: 80,
  2: 120,
  3: 180,
  4: 260,
  5: 260,
} as const;

export const TIME_BONUS_THRESHOLDS = [
  { maxSeconds: 20, bonus: 100 },
  { maxSeconds: 40, bonus: 80 },
  { maxSeconds: 60, bonus: 60 },
  { maxSeconds: 120, bonus: 40 },
  { maxSeconds: 240, bonus: 20 },
] as const;

export const GUESS_BONUS = {
  0: 60,
  1: 40,
  2: 20,
} as const;

export const FIRST_PLAY_BONUS = 40;

export const MAX_MOVIE_SCORE = 1200;

export const REVEAL_ANIMATION_MS = 500;
