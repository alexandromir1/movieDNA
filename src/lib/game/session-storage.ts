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
  if (typeof window === "undefined") return;
  localStorage.setItem(sessionKey(session.challengeId), JSON.stringify(session));
}

/** Была ли уже завершена игра по этому challenge (для First Play Bonus) */
export function hasCompletedChallengeBefore(challengeId: string): boolean {
  if (typeof window === "undefined") return false;

  try {
    const raw = localStorage.getItem(sessionKey(challengeId));
    if (!raw) return false;
    const session = JSON.parse(raw) as GameSession;
    return session.state === "COMPLETED" && session.movieScore !== null;
  } catch {
    return false;
  }
}
