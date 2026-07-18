/** Один фильм внутри ручной подборки. */
export interface MovieRecommendationItem {
  movieId: string;
  /** Короткая подпись после названия: «любовь вопреки времени» */
  note?: string;
}

/** Категория подборки — как в редакторском списке. */
export interface MovieRecommendationCategory {
  /** Заголовок категории, можно с эмодзи: «❤️ Если хочется большой любви» */
  title: string;
  items: MovieRecommendationItem[];
}

export interface Movie {
  id: string;
  title: string;
  titleOriginal: string | null;
  year: number;
  aliases: string[];
  /**
   * Ручные подборки по категориям («что посмотреть»).
   * Правило контента: не включать фильмы из ближайшего окна будущих Daily
   * (upcoming scheduled) — иначе спойлер угадайки.
   * Пусто / отсутствует → блок на результате скрыт.
   */
  recommendations?: MovieRecommendationCategory[];
}

export interface RevealRegion {
  id: string;
  name: string;
  /** Полигон в координатах изображения [[x,y], ...]. Пустой для full_image. */
  polygon: number[][];
  /** Порядок открытия 1–5 */
  displayOrder: number;
  scorePenalty: number;
  /** Полное изображение — последняя подсказка */
  kind?: "area" | "full_image";
}

export interface Level {
  id: string;
  movieId: string;
  difficulty: "easy" | "medium" | "hard";
  image: string;
  width: number;
  height: number;
  revealRegions: RevealRegion[];
  acceptedAnswers: string[];
}

export type ChallengeStatus = "draft" | "ready" | "scheduled";

/**
 * Вычисляемое состояние расписания.
 * Не хранится в JSON — только status + date (publishAt).
 */
export type ChallengeScheduleBucket = "upcoming" | "today" | "archive";

export interface Challenge {
  id: string;
  levelId: string;
  /** UTC date YYYY-MM-DD — дата публикации (publishAt) */
  date: string;
  status: ChallengeStatus;
  /** Challenge IDs for "Что пройти дальше?" after Archive */
  relatedChallenges?: string[];
}

export type GameState =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "LOST"
  | "ARCHIVED";

export interface GameGuess {
  value: string;
  isCorrect: boolean;
  createdAt: string;
}

export interface GameSession {
  challengeId: string;
  date: string;
  state: GameState;
  /** Сколько Reveal Regions открыто (0–5) */
  openedRegionCount: number;
  guesses: GameGuess[];
  startedAt: string | null;
  completedAt: string | null;
  movieScore: number | null;
  isFirstPlay: boolean;
}

/**
 * Score-тип теперь принадлежит Engine (src/engine/score).
 * Реэкспортируется здесь для обратной совместимости существующих импортов.
 */
export type { MovieScoreBreakdown } from "@/engine/score";
