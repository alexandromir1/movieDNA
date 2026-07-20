/**
 * Тайминги внутри Challenge для аналитики.
 * Живёт только на клиенте; Engine не зависит от этого модуля.
 */

let challengeStartedAtMs: number | null = null;
let firstGuessAtMs: number | null = null;
let lastRegionAtMs: number | null = null;

export function resetChallengeTiming(): void {
  challengeStartedAtMs = Date.now();
  firstGuessAtMs = null;
  lastRegionAtMs = null;
}

export function clearChallengeTiming(): void {
  challengeStartedAtMs = null;
  firstGuessAtMs = null;
  lastRegionAtMs = null;
}

/** Вызвать при первой непустой попытке. */
export function markFirstGuessIfNeeded(): number | null {
  if (firstGuessAtMs != null) return getSecondsToFirstGuess();
  if (challengeStartedAtMs == null) return null;
  firstGuessAtMs = Date.now();
  return getSecondsToFirstGuess();
}

export function getSecondsToFirstGuess(): number | null {
  if (challengeStartedAtMs == null || firstGuessAtMs == null) return null;
  return Math.max(
    0,
    Math.round((firstGuessAtMs - challengeStartedAtMs) / 1000),
  );
}

/**
 * Секунды с прошлого региона (или со старта Challenge).
 * Обновляет якорь «последний регион».
 */
export function markRegionOpened(): number | null {
  const now = Date.now();
  const anchor = lastRegionAtMs ?? challengeStartedAtMs;
  lastRegionAtMs = now;
  if (anchor == null) return null;
  return Math.max(0, Math.round((now - anchor) / 1000));
}

export function getSecondsPlayed(): number {
  if (challengeStartedAtMs == null) return 0;
  return Math.max(0, Math.round((Date.now() - challengeStartedAtMs) / 1000));
}

export function hasChallengeTiming(): boolean {
  return challengeStartedAtMs != null;
}
