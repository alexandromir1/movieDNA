import type { GameSession } from "@/types/game";

const STORAGE_PREFIX = "kinoshka-game";

function storageKey(puzzleId: string): string {
  return `${STORAGE_PREFIX}:${puzzleId}`;
}

export function loadGameSession(puzzleId: string): GameSession | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(storageKey(puzzleId));
    if (!raw) return null;
    return JSON.parse(raw) as GameSession;
  } catch {
    return null;
  }
}

export function saveGameSession(session: GameSession): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(session.puzzleId), JSON.stringify(session));
}

export function createInitialSession(puzzleId: string, date: string, maxAttempts: number): GameSession {
  return {
    puzzleId,
    date,
    attempts: [],
    currentFrameIndex: 0,
    status: "pending",
    maxAttempts,
  };
}
