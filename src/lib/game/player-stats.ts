import { PERSISTENCE_ENABLED } from "@/config/game";

export interface CompletedChallengeRecord {
  challengeId: string;
  date: string;
  won: boolean;
  movieScore: number;
  openedRegionCount: number;
  wrongGuessCount: number;
  elapsedSeconds: number;
}

export interface PlayerProfileStats {
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
  averageMovieScore: number;
  averageOpenedRegions: number;
  bestMovieScore: number;
  currentStreak: number;
  maxStreak: number;
  completedChallenges: CompletedChallengeRecord[];
}

const STATS_KEY = "moviedna-stats";
const LEGACY_STATS_KEYS = ["kinoshka-stats"];

export function createEmptyPlayerStats(): PlayerProfileStats {
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    winRate: 0,
    averageMovieScore: 0,
    averageOpenedRegions: 0,
    bestMovieScore: 0,
    currentStreak: 0,
    maxStreak: 0,
    completedChallenges: [],
  };
}

export function loadPlayerStats(): PlayerProfileStats {
  if (!PERSISTENCE_ENABLED) return createEmptyPlayerStats();
  if (typeof window === "undefined") return createEmptyPlayerStats();

  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return createEmptyPlayerStats();
    return derivePlayerStats(
      (JSON.parse(raw) as PlayerProfileStats).completedChallenges ?? [],
    );
  } catch {
    return createEmptyPlayerStats();
  }
}

export function savePlayerStats(stats: PlayerProfileStats): void {
  if (!PERSISTENCE_ENABLED) return;
  if (typeof window === "undefined") return;
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  window.dispatchEvent(new Event("moviedna:stats-updated"));
}

export function clearStoredStats(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STATS_KEY);
  LEGACY_STATS_KEYS.forEach((key) => localStorage.removeItem(key));
  window.dispatchEvent(new Event("moviedna:stats-updated"));
}

function addUtcDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days))
    .toISOString()
    .split("T")[0];
}

function computeCurrentStreak(records: CompletedChallengeRecord[]): number {
  const wins = records.filter((record) => record.won);
  if (wins.length === 0) return 0;

  const byDate = new Map(wins.map((record) => [record.date, record]));
  let streak = 0;
  let date = new Date().toISOString().split("T")[0];

  while (byDate.has(date)) {
    streak++;
    date = addUtcDays(date, -1);
  }

  return streak;
}

function computeMaxStreak(records: CompletedChallengeRecord[]): number {
  const wins = [...records]
    .filter((record) => record.won)
    .sort((a, b) => a.date.localeCompare(b.date));

  let max = 0;
  let current = 0;
  let prev: string | null = null;

  for (const record of wins) {
    if (prev && addUtcDays(prev, 1) === record.date) {
      current += 1;
    } else {
      current = 1;
    }
    max = Math.max(max, current);
    prev = record.date;
  }

  return max;
}

export function derivePlayerStats(
  completedChallenges: CompletedChallengeRecord[],
): PlayerProfileStats {
  const gamesPlayed = completedChallenges.length;
  const gamesWon = completedChallenges.filter((record) => record.won).length;
  const totalScore = completedChallenges.reduce(
    (sum, record) => sum + record.movieScore,
    0,
  );
  const totalRegions = completedChallenges.reduce(
    (sum, record) => sum + record.openedRegionCount,
    0,
  );

  return {
    gamesPlayed,
    gamesWon,
    winRate: gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0,
    averageMovieScore:
      gamesPlayed > 0 ? Math.round(totalScore / gamesPlayed) : 0,
    averageOpenedRegions:
      gamesPlayed > 0
        ? Math.round((totalRegions / gamesPlayed) * 10) / 10
        : 0,
    bestMovieScore: completedChallenges.reduce(
      (best, record) => Math.max(best, record.movieScore),
      0,
    ),
    currentStreak: computeCurrentStreak(completedChallenges),
    maxStreak: computeMaxStreak(completedChallenges),
    completedChallenges,
  };
}

export function recordChallengeResult(
  record: CompletedChallengeRecord,
): PlayerProfileStats {
  if (!PERSISTENCE_ENABLED) {
    return createEmptyPlayerStats();
  }

  const stats = loadPlayerStats();

  if (
    stats.completedChallenges.some(
      (item) => item.challengeId === record.challengeId,
    )
  ) {
    return stats;
  }

  const next = derivePlayerStats([...stats.completedChallenges, record]);
  savePlayerStats(next);
  return next;
}
