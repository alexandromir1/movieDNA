/**
 * @deprecated Логика перенесена в Engine (src/engine/score).
 * Этот файл — временный shim обратной совместимости и будет удалён
 * на этапе очистки (PR №5). Новый код должен импортировать из "@/engine".
 */

export {
  calculateGuessBonus,
  calculateMovieScore,
  calculateRevealScore,
  calculateTimeBonus,
  getRevealPenalty,
} from "@/engine/score";

export type { MovieScoreBreakdown, MovieScoreInput } from "@/engine/score";
