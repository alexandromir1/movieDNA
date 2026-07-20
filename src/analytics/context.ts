import type { AnalyticsCommonProperties } from "./events";
import { getSecondsToFirstGuess } from "./timing";

/** Контекст текущего Challenge — обновляет UI/хук на клиенте. */
export interface AnalyticsChallengeContext {
  challengeId: string | null;
  regionsOpened: number;
  hintsUsed: number;
  attempts: number;
  movieId: string | null;
  movieTitle: string | null;
  movieYear: number | null;
  /** Через запятую или null, если жанров нет в контенте. */
  genres: string | null;
}

const EMPTY_CHALLENGE: AnalyticsChallengeContext = {
  challengeId: null,
  regionsOpened: 0,
  hintsUsed: 0,
  attempts: 0,
  movieId: null,
  movieTitle: null,
  movieYear: null,
  genres: null,
};

let challengeContext: AnalyticsChallengeContext = { ...EMPTY_CHALLENGE };
let localeContext: string | null = null;

export function setAnalyticsChallengeContext(
  next: AnalyticsChallengeContext,
): void {
  challengeContext = { ...next };
}

export function clearAnalyticsChallengeContext(): void {
  challengeContext = { ...EMPTY_CHALLENGE };
}

export function setAnalyticsLocale(locale: string | null): void {
  localeContext = locale;
}

function getDeviceType(width: number): string {
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

/**
 * Собирает обязательные поля для любого события.
 * На SSR возвращает безопасные нули/null — track всё равно no-op без window.
 */
export function buildCommonProperties(): AnalyticsCommonProperties {
  const movie = {
    movieId: challengeContext.movieId,
    movieTitle: challengeContext.movieTitle,
    movieYear: challengeContext.movieYear,
    genres: challengeContext.genres,
  };

  if (typeof window === "undefined") {
    return {
      challengeId: challengeContext.challengeId,
      locale: localeContext,
      regionsOpened: challengeContext.regionsOpened,
      hintsUsed: challengeContext.hintsUsed,
      attempts: challengeContext.attempts,
      deviceType: "unknown",
      screenWidth: 0,
      screenHeight: 0,
      ...movie,
      secondsToFirstGuess: getSecondsToFirstGuess(),
    };
  }

  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  return {
    challengeId: challengeContext.challengeId,
    locale: localeContext,
    regionsOpened: challengeContext.regionsOpened,
    hintsUsed: challengeContext.hintsUsed,
    attempts: challengeContext.attempts,
    deviceType: getDeviceType(screenWidth),
    screenWidth,
    screenHeight,
    ...movie,
    secondsToFirstGuess: getSecondsToFirstGuess(),
  };
}
