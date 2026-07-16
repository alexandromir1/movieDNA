export interface Movie {
  id: string;
  title: string;
  titleOriginal: string | null;
  year: number;
  aliases: string[];
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

export type ChallengeStatus = "draft" | "testing" | "ready" | "scheduled" | "published" | "archived";

export interface Challenge {
  id: string;
  levelId: string;
  /** UTC date YYYY-MM-DD */
  date: string;
  status: ChallengeStatus;
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
