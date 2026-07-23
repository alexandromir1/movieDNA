/**
 * Доменные типы MovieDNA v2 — docs/v2-domain-model.md.
 * Параллельны v1 `Level` / `revealRegions`; не смешивать с Challenge/Daily.
 */

/** Точка полигона в координатах исходного изображения. */
export type ImagePoint = [number, number];

/** Один упорядоченный кусок Fragments (данные стратегии). */
export interface FragmentPiece {
  id: string;
  polygon: ImagePoint[];
}

/** Данные RevealDefinition kind=fragments. */
export interface FragmentsDefinition {
  /** Порядок показа = порядок массива. Игрок не выбирает кусок. */
  pieces: FragmentPiece[];
}

export type RevealKind = "fragments" | "blur" | "focus" | "color" | "light";

export type LevelDifficulty = "easy" | "medium" | "hard";

/**
 * Как раскрывается изображение уровня.
 * В v2.0 у каждого Level ровно одна definition kind=fragments.
 */
export interface RevealDefinitionFragments {
  kind: "fragments";
  /** Число шагов (= pieces.length для fragments). */
  stepCount: number;
  data: FragmentsDefinition;
}

export type RevealDefinition = RevealDefinitionFragments;

/** Испытание в очереди (контент). Не владеет Progress / openedSteps. */
export interface V2Level {
  id: string;
  movieId: string;
  difficulty: LevelDifficulty;
  image: string;
  width: number;
  height: number;
  acceptedAnswers: string[];
  revealDefinition: RevealDefinition;
}

/** Снимок итога Session (без записи в Progress). */
export interface V2LevelResult {
  levelId: string;
  movieId: string;
  movieTitle: { ru: string; en: string };
  openedSteps: number;
  totalSteps: number;
  attemptCount: number;
  completedAt: string;
  /** won по умолчанию; lost — сдача (presentation + app handoff). */
  outcome?: "won" | "lost";
}

/**
 * Глобальный порядок уровней (docs/v2-domain-model.md §6.6).
 * Владеет только порядком id — не контентом Level/Movie.
 */
export interface LevelSequence {
  levelIds: string[];
}

/**
 * Кампания = именованная LevelSequence + метаданные.
 * Engine работает с sequence; конкретный campaign id ему не нужен.
 */
export interface Campaign {
  id: string;
  name: { ru: string; en: string };
  description: { ru: string; en: string };
  sequence: LevelSequence;
}

/**
 * Минимальный Player.Progress (docs/v2-domain-model.md §6.1).
 * `currentSequenceIndex` = текущий уровень в очереди (0-based).
 * Продуктово: «currentLevel» / куда ведёт «Продолжить».
 */
export interface V2PlayerProgress {
  currentSequenceIndex: number;
}
