/** Публичный API Score-модуля Engine. */

export {
  calculateGuessBonus,
  calculateMovieScore,
  calculateRevealScore,
  calculateTimeBonus,
  getRevealPenalty,
} from "./calculator";

export type { MovieScoreBreakdown, MovieScoreInput } from "./types";
