/**
 * Типизированный каталог аналитических событий MovieDNA.
 *
 * UI и Engine вызывают только `analytics.track(name, payload)`.
 * Конкретные сервисы (GA4, PostHog, …) подключаются через Providers.
 */

/** События, которые поддерживает система аналитики. */
export type AnalyticsEventName =
  | "page_view"
  | "session_started"
  | "session_ended"
  | "home_open"
  | "archive_opened"
  | "challenge_started"
  | "region_opened"
  | "hint_used"
  | "guess_submitted"
  | "correct_guess"
  | "wrong_guess"
  | "challenge_completed"
  | "challenge_failed"
  | "challenge_abandoned"
  | "challenge_give_up"
  | "recommendation_click"
  | "recommendation_viewed"
  | "movie_selected"
  | "language_changed"
  | "image_viewer_opened"
  | "share_click"
  | "moment_of_recognition";

/**
 * Общие поля — добавляются к каждому событию автоматически.
 */
export interface AnalyticsCommonProperties {
  challengeId: string | null;
  locale: string | null;
  regionsOpened: number;
  hintsUsed: number;
  attempts: number;
  deviceType: string;
  screenWidth: number;
  screenHeight: number;
  movieId: string | null;
  movieTitle: string | null;
  movieYear: number | null;
  genres: string | null;
  /** Секунды до первой непустой попытки; null пока не было guess. */
  secondsToFirstGuess: number | null;
}

/**
 * Payload каждого события (поверх common).
 */
export interface AnalyticsEventMap {
  page_view: {
    path: string;
    title?: string;
  };

  session_started: Record<string, never>;

  session_ended: {
    durationSeconds?: number;
  };

  home_open: Record<string, never>;

  archive_opened: Record<string, never>;

  challenge_started: {
    challengeId?: string;
    date?: string;
  };

  region_opened: {
    challengeId?: string;
    regionIndex?: number;
    regionId?: string;
    /** Секунды с предыдущего региона (или со старта Challenge). */
    timeBetweenRegions?: number;
  };

  hint_used: {
    challengeId?: string;
    regionIndex?: number;
    regionId?: string;
    timeBetweenRegions?: number;
  };

  guess_submitted: {
    challengeId?: string;
    guessLength?: number;
    attemptCount?: number;
  };

  correct_guess: {
    challengeId?: string;
    openedRegionCount?: number;
    attemptCount?: number;
  };

  wrong_guess: {
    challengeId?: string;
    openedRegionCount?: number;
    attemptCount?: number;
  };

  challenge_completed: {
    challengeId?: string;
    movieScore?: number;
    openedRegionCount?: number;
    secondsPlayed?: number;
  };

  challenge_failed: {
    challengeId?: string;
    openedRegionCount?: number;
    secondsPlayed?: number;
  };

  challenge_abandoned: {
    challengeId?: string;
    openedRegionCount?: number;
    attemptCount?: number;
    secondsPlayed?: number;
  };

  challenge_give_up: {
    challengeId?: string;
    openedRegionCount?: number;
  };

  recommendation_click: {
    challengeId?: string;
    href?: string;
  };

  recommendation_viewed: {
    sourceMovieId?: string;
    sourceMovieTitle?: string;
  };

  movie_selected: {
    movieId?: string;
    movieTitle?: string;
    movieYear?: number;
  };

  language_changed: {
    locale?: string;
    previousLocale?: string;
  };

  image_viewer_opened: {
    challengeId?: string;
  };

  share_click: {
    challengeId?: string;
    movieScore?: number;
  };

  /** На каком регионе игрок впервые «узнал» фильм (самоотчёт). */
  moment_of_recognition: {
    challengeId?: string;
    regionIndex?: number | null;
    /** never = не понял до конца / пропустил */
    answer?: "region" | "never" | "skipped";
  };
}

/** Payload для конкретного события. */
export type AnalyticsPayload<E extends AnalyticsEventName> =
  AnalyticsEventMap[E];

export type TrackArgs<E extends AnalyticsEventName> =
  AnalyticsEventMap[E] extends Record<string, never>
    ? [payload?: AnalyticsEventMap[E]]
    : [payload: AnalyticsEventMap[E]];

/** Плоский словарь свойств, который уходит в провайдеры. */
export type AnalyticsProperties = Record<
  string,
  string | number | boolean | null | undefined
>;
