import { PERSISTENCE_ENABLED } from "@/config/game";

import type { GameSession } from "@/types/content";

const SESSION_PREFIX = "moviedna-session";

function sessionKey(challengeId: string): string {
  return `${SESSION_PREFIX}:${challengeId}`;
}

export function createInitialSession(
  challengeId: string,
  date: string,
): GameSession {
  return {
    challengeId,
    date,
    state: "NOT_STARTED",
    openedRegionCount: 0,
    guesses: [],
    startedAt: null,
    completedAt: null,
    movieScore: null,
    isFirstPlay: true,
  };
}

export function loadGameSession(challengeId: string): GameSession | null {
  if (!PERSISTENCE_ENABLED) return null;
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(sessionKey(challengeId));
    if (!raw) return null;
    return JSON.parse(raw) as GameSession;
  } catch {
    return null;
  }
}

export function saveGameSession(session: GameSession): void {
  if (!PERSISTENCE_ENABLED) return;
  if (typeof window === "undefined") return;
  localStorage.setItem(sessionKey(session.challengeId), JSON.stringify(session));
}

/** Была ли уже завершена игра по этому challenge (для First Play Bonus) */
export function hasCompletedChallengeBefore(challengeId: string): boolean {
  if (!PERSISTENCE_ENABLED) return false;
  if (typeof window === "undefined") return false;

  try {
    const raw = localStorage.getItem(sessionKey(challengeId));
    if (!raw) return false;
    const session = JSON.parse(raw) as GameSession;
    return session.state === "COMPLETED" || session.state === "LOST";
  } catch {
    return false;
  }
}

/** Сбрасывает сохранённые сессии (для тестового режима) */
export function clearStoredSessions(): void {
  if (typeof window === "undefined") return;

  const keysToRemove: string[] = [];
  for (let index = 0; index < localStorage.length; index++) {
    const key = localStorage.key(index);
    if (!key) continue;
    if (
      key.startsWith(SESSION_PREFIX) ||
      key.startsWith("kinoshka-game:")
    ) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key));
}
