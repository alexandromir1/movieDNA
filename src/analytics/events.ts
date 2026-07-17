/**
 * Типизированный каталог аналитических событий MovieDNA.
 *
 * UI и Engine вызывают только `analytics.track(name, payload)`.
 * Конкретные сервисы (GA4, Clarity, …) подключаются через Providers.
 */

/** События, которые поддерживает система аналитики. */
export type AnalyticsEventName =
  | "page_view"
  | "challenge_started"
  | "challenge_completed"
  | "challenge_failed"
  | "challenge_give_up"
  | "reveal_opened"
  | "guess_submitted"
  | "guess_correct"
  | "guess_wrong"
  | "archive_opened"
  | "challenge_shared";

/**
 * Payload каждого события.
 * События без доп. данных имеют `Record<string, never>` —
 * вызов: `analytics.track("archive_opened")` или с `{}`.
 */
export interface AnalyticsEventMap {
  page_view: {
    path: string;
    title?: string;
  };

  challenge_started: {
    challengeId: string;
    date?: string;
  };

  challenge_completed: {
    challengeId: string;
    movieScore: number;
    openedRegionCount?: number;
  };

  challenge_failed: {
    challengeId: string;
    openedRegionCount?: number;
  };

  challenge_give_up: {
    challengeId: string;
    openedRegionCount?: number;
  };

  reveal_opened: {
    challengeId: string;
    regionIndex: number;
    regionId?: string;
  };

  guess_submitted: {
    challengeId: string;
    guessLength?: number;
    attemptCount?: number;
  };

  guess_correct: {
    challengeId: string;
    openedRegionCount?: number;
    attemptCount?: number;
  };

  guess_wrong: {
    challengeId: string;
    openedRegionCount?: number;
    attemptCount?: number;
  };

  archive_opened: Record<string, never>;

  challenge_shared: {
    challengeId: string;
    movieScore?: number;
  };
}

/** Payload для конкретного события. */
export type AnalyticsPayload<E extends AnalyticsEventName> =
  AnalyticsEventMap[E];

/**
 * Аргументы track():
 * - если payload пустой объект — аргумент опционален;
 * - иначе payload обязателен.
 */
export type TrackArgs<E extends AnalyticsEventName> =
  AnalyticsEventMap[E] extends Record<string, never>
    ? [payload?: AnalyticsEventMap[E]]
    : [payload: AnalyticsEventMap[E]];

/** Плоский словарь свойств, который уходит в провайдеры. */
export type AnalyticsProperties = Record<
  string,
  string | number | boolean | null | undefined
>;
