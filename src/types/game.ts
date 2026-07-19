export type PuzzleStatus = "pending" | "won" | "lost";

export interface Movie {
  id: string;
  title: string;
  titleOriginal: string | null;
  year: number;
  frameUrls: string[];
  hints: string[];
}

export interface DailyPuzzle {
  id: string;
  date: string;
  movieId: string;
  movie: Movie;
}

export interface GameAttempt {
  attemptNumber: number;
  guess: string;
  isCorrect: boolean;
  skipped: boolean;
  createdAt: string;
}

export interface GameSession {
  puzzleId: string;
  date: string;
  attempts: GameAttempt[];
  currentFrameIndex: number;
  status: PuzzleStatus;
  maxAttempts: number;
}

export interface GuessResult {
  isCorrect: boolean;
  attemptsLeft: number;
  status: PuzzleStatus;
}

export interface MovieSuggestion {
  id: string;
  /** Уже локализованное название для текущей UI-локали */
  title: string;
  year: number;
}
