import {
  FIRST_PLAY_BONUS,
  GUESS_BONUS,
  REVEAL_PENALTIES,
  REVEAL_SCORE_BASE,
  TIME_BONUS_THRESHOLDS,
} from "@/config/economy";

import type { MovieScoreBreakdown, MovieScoreInput } from "./types";

/**
 * Score Calculator — чистый модуль Engine.
 *
 * Не зависит от React/Next.js: только вход → детерминированный результат.
 * Экономические константы берутся из config/economy.ts (Single Source of Truth).
 */

export function getRevealPenalty(displayOrder: number): number {
  if (displayOrder < 1 || displayOrder > 5) return 0;
  return REVEAL_PENALTIES[displayOrder as keyof typeof REVEAL_PENALTIES];
}

export function calculateRevealScore(openedRegionCount: number): number {
  let score = REVEAL_SCORE_BASE;

  for (let order = 1; order <= openedRegionCount; order++) {
    score -= getRevealPenalty(order);
  }

  return Math.max(0, score);
}

export function calculateTimeBonus(elapsedSeconds: number): number {
  for (const threshold of TIME_BONUS_THRESHOLDS) {
    if (elapsedSeconds <= threshold.maxSeconds) {
      return threshold.bonus;
    }
  }
  return 0;
}

export function calculateGuessBonus(wrongGuessCount: number): number {
  if (wrongGuessCount <= 0) return GUESS_BONUS[0];
  if (wrongGuessCount === 1) return GUESS_BONUS[1];
  if (wrongGuessCount === 2) return GUESS_BONUS[2];
  return 0;
}

export function calculateMovieScore(input: MovieScoreInput): MovieScoreBreakdown {
  const revealScore = calculateRevealScore(input.openedRegionCount);
  const timeBonus = calculateTimeBonus(input.elapsedSeconds);
  const guessBonus = calculateGuessBonus(input.wrongGuessCount);
  const firstPlayBonus = input.isFirstPlay ? FIRST_PLAY_BONUS : 0;

  return {
    revealScore,
    timeBonus,
    guessBonus,
    firstPlayBonus,
    total: revealScore + timeBonus + guessBonus + firstPlayBonus,
    openedRegionCount: input.openedRegionCount,
    wrongGuessCount: input.wrongGuessCount,
    elapsedSeconds: input.elapsedSeconds,
  };
}
