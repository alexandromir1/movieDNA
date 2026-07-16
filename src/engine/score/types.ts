/**
 * Score-типы Engine.
 *
 * Engine независим от Next.js и UI. Эти типы описывают вход и результат
 * расчёта Movie Score и являются частью публичного API Engine.
 */

export interface MovieScoreBreakdown {
  revealScore: number;
  timeBonus: number;
  guessBonus: number;
  firstPlayBonus: number;
  total: number;
  openedRegionCount: number;
  wrongGuessCount: number;
  elapsedSeconds: number;
}

export interface MovieScoreInput {
  openedRegionCount: number;
  wrongGuessCount: number;
  elapsedSeconds: number;
  isFirstPlay: boolean;
}
