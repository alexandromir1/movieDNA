/**
 * Типизированный каталог аналитических событий MovieDNA.
 *
 * UI и Engine вызывают только `analytics.track(name, payload)`.
 * Конкретные сервисы (GA4, PostHog, …) подключаются через Providers.
 *
 * V1 Challenge events и V2 Case Analytics живут рядом:
 * V1 не меняем; V2 шлёт `case_*` / archive_* / related_* / campaign_*.
 * См. docs/analytics-v2.md.
 */

/** Режим игры (V2 Case Analytics; зарезервированы future modes). */
export type AnalyticsGameMode =
  | "campaign"
  | "archive"
  | "deferred"
  | "daily"
  | "pvp";

/** Откуда игрок пришёл в расследование / связанный экран. */
export type AnalyticsEnteredFrom =
  | "home"
  | "archive"
  | "campaign_complete"
  | "recommendations"
  | "deeplink"
  | "continue";

/** Общие поля Case Analytics (Investigation + связанные экраны). */
export interface CaseAnalyticsProperties {
  challengeId?: string;
  movieId?: string;
  /** Порядковый номер дела в кампании (1, 15, 327) — не id. */
  caseNumber?: number;
  gameMode?: AnalyticsGameMode;
  enteredFrom?: AnalyticsEnteredFrom;
}

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
  | "search_used"
  | "start_button_clicked"
  | "recommendation_click"
  | "recommendation_viewed"
  | "recommendation_clicked"
  | "movie_selected"
  | "language_changed"
  | "image_viewer_opened"
  | "share_click"
  | "moment_of_recognition"
  // —— V2 Case Analytics ——
  | "case_started"
  | "case_fragment_opened"
  | "case_guess_submitted"
  | "case_guess_correct"
  | "case_guess_wrong"
  | "case_deferred"
  | "case_give_up"
  | "case_completed"
  | "archive_case_opened"
  | "archive_case_resumed"
  | "related_cases_opened"
  | "related_cases_clicked"
  | "campaign_completed"
  | "campaign_resume_deferred";

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
    startedFromRecommendation?: boolean;
    recommendedMovieId?: string;
    recommendedMovieTitle?: string;
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

  search_used: {
    queryLength: number;
    resultsCount: number;
    selectedMovieId: string;
    selectedMovieTitle: string;
    selectedMovieYear?: number;
  };

  start_button_clicked: Record<string, never>;

  recommendation_click: {
    challengeId?: string;
    href?: string;
  };

  recommendation_viewed: {
    currentMovieId?: string;
    currentMovieTitle?: string;
    recommendedMovieId?: string;
    recommendedMovieTitle?: string;
    recommendationSection?: string;
    position?: number;
    /** @deprecated use currentMovieId */
    sourceMovieId?: string;
    /** @deprecated use currentMovieTitle */
    sourceMovieTitle?: string;
  };

  recommendation_clicked: {
    currentMovieId?: string;
    currentMovieTitle?: string;
    recommendedMovieId: string;
    recommendedMovieTitle: string;
    recommendationSection: string;
    position: number;
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

  // —— V2 Case Analytics ——

  case_started: CaseAnalyticsProperties;

  case_fragment_opened: CaseAnalyticsProperties & {
    regionIndex?: number;
    timeBetweenRegions?: number;
  };

  case_guess_submitted: CaseAnalyticsProperties & {
    guessLength?: number;
    attemptCount?: number;
  };

  case_guess_correct: CaseAnalyticsProperties & {
    openedRegionCount?: number;
    attemptCount?: number;
  };

  case_guess_wrong: CaseAnalyticsProperties & {
    openedRegionCount?: number;
    attemptCount?: number;
  };

  case_deferred: CaseAnalyticsProperties & {
    openedRegionCount?: number;
    attemptCount?: number;
  };

  case_give_up: CaseAnalyticsProperties & {
    openedRegionCount?: number;
    secondsPlayed?: number;
  };

  case_completed: CaseAnalyticsProperties & {
    openedRegionCount?: number;
    secondsPlayed?: number;
  };

  archive_case_opened: CaseAnalyticsProperties;

  archive_case_resumed: CaseAnalyticsProperties;

  related_cases_opened: CaseAnalyticsProperties & {
    source?: "result" | "archive";
  };

  related_cases_clicked: CaseAnalyticsProperties & {
    href?: string;
    source?: "result" | "archive";
  };

  campaign_completed: CaseAnalyticsProperties & {
    deferredRemaining?: number;
  };

  campaign_resume_deferred: CaseAnalyticsProperties & {
    deferredRemaining?: number;
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
