import { loadPlayerStats } from "@/lib/game/player-stats";
import { loadGameSession } from "@/lib/game/session-storage";

export type ChallengePlayStatus =
  | "available"
  | "in_progress"
  | "won"
  | "lost";

export function resolveChallengePlayStatus(input: {
  challengeId: string;
  date: string;
}): ChallengePlayStatus {
  const stats = loadPlayerStats();
  const record = stats.completedChallenges.find(
    (entry) =>
      entry.challengeId === input.challengeId || entry.date === input.date,
  );
  if (record) return record.won ? "won" : "lost";

  const session = loadGameSession(input.challengeId);
  if (!session) return "available";
  if (session.state === "COMPLETED") return "won";
  if (session.state === "LOST") return "lost";
  if (
    session.startedAt ||
    session.openedRegionCount > 0 ||
    session.guesses.length > 0
  ) {
    return "in_progress";
  }
  return "available";
}
