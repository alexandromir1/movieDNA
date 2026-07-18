import { loadPlayerStats } from "@/lib/game/player-stats";
import { loadGameSession, saveGameSession } from "@/lib/game/session-storage";

import type { GameGuess, GameSession } from "@/types/content";

/**
 * Восстанавливает завершённую сессию из stats, если localStorage сессии нет.
 * Нужно, чтобы пройденный архив можно было снова открыть: счёт, картинка, подборка.
 * Повторно играть нельзя — только просмотр результата.
 */
export function ensureArchiveReviewSession(challenge: {
  id: string;
  date: string;
}): GameSession | null {
  const existing = loadGameSession(challenge.id);
  if (
    existing &&
    (existing.state === "COMPLETED" || existing.state === "LOST")
  ) {
    return existing;
  }

  const record = loadPlayerStats().completedChallenges.find(
    (entry) =>
      entry.challengeId === challenge.id || entry.date === challenge.date,
  );
  if (!record) return existing;

  const completedAt = new Date().toISOString();
  const startedAt = new Date(
    Date.now() - Math.max(0, record.elapsedSeconds) * 1000,
  ).toISOString();

  const wrongGuesses: GameGuess[] = Array.from(
    { length: Math.max(0, record.wrongGuessCount) },
    () => ({
      value: "—",
      isCorrect: false,
      createdAt: startedAt,
    }),
  );

  const guesses: GameGuess[] = record.won
    ? [
        ...wrongGuesses,
        { value: "—", isCorrect: true, createdAt: completedAt },
      ]
    : wrongGuesses;

  const session: GameSession = {
    challengeId: challenge.id,
    date: challenge.date,
    state: record.won ? "COMPLETED" : "LOST",
    openedRegionCount: record.openedRegionCount,
    guesses,
    startedAt,
    completedAt,
    movieScore: record.movieScore,
    isFirstPlay: false,
  };

  saveGameSession(session);
  return session;
}
