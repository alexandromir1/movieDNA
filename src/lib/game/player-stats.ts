import { PERSISTENCE_ENABLED } from "@/config/game";
import { addUtcDays, getUtcDateString } from "@/lib/game/daily";

export type ChallengePlaySource = "daily" | "archive";

export interface CompletedChallengeRecord {
  challengeId: string;
  date: string;
  won: boolean;
  movieScore: number;
  openedRegionCount: number;
  wrongGuessCount: number;
  elapsedSeconds: number;
  /** daily = Today's Challenge; archive = Archive mode */
  source?: ChallengePlaySource;
}

export interface PlayerProfileStats {
  currentStreak: number;
  bestMovieScore: number;
  averageMovieScore: number;
  dailyCompleted: number;
  archiveCompleted: number;
  totalChallenges: number;
  lastPlayedDate: string | null;
  /** Last Daily win date (UTC YYYY-MM-DD); used for streak increments */
  lastDailyWinDate: string | null;
  completedChallenges: CompletedChallengeRecord[];
}

const STATS_KEY = "moviedna-stats";
const LEGACY_STATS_KEYS = ["kinoshka-stats"];

export function createEmptyPlayerStats(): PlayerProfileStats {
  return {
    currentStreak: 0,
    bestMovieScore: 0,
    averageMovieScore: 0,
    dailyCompleted: 0,
    archiveCompleted: 0,
    totalChallenges: 0,
    lastPlayedDate: null,
    lastDailyWinDate: null,
    completedChallenges: [],
  };
}

function resolveSource(
  record: CompletedChallengeRecord,
  today: string,
): ChallengePlaySource {
  if (record.source === "daily" || record.source === "archive") {
    return record.source;
  }
  // Legacy records: treat as daily to preserve prior streak behaviour
  if (record.date <= today) return "daily";
  return "archive";
}

function recomputeAggregates(
  records: CompletedChallengeRecord[],
  streakState: Pick<
    PlayerProfileStats,
    "currentStreak" | "lastPlayedDate" | "lastDailyWinDate"
  >,
  today: string = getUtcDateString(),
): PlayerProfileStats {
  let dailyCompleted = 0;
  let archiveCompleted = 0;
  const wonScores: number[] = [];

  for (const record of records) {
    const source = resolveSource(record, today);
    if (source === "daily") dailyCompleted += 1;
    else archiveCompleted += 1;
    if (record.won && record.movieScore > 0) {
      wonScores.push(record.movieScore);
    } else if (record.won) {
      wonScores.push(record.movieScore);
    }
  }

  const bestMovieScore = wonScores.reduce((best, score) => Math.max(best, score), 0);
  const averageMovieScore =
    wonScores.length > 0
      ? Math.round(wonScores.reduce((sum, score) => sum + score, 0) / wonScores.length)
      : 0;

  let currentStreak = streakState.currentStreak;
  const yesterday = addUtcDays(today, -1);
  if (
    streakState.lastPlayedDate &&
    streakState.lastPlayedDate < yesterday
  ) {
    currentStreak = 0;
  }

  return {
    currentStreak,
    bestMovieScore,
    averageMovieScore,
    dailyCompleted,
    archiveCompleted,
    totalChallenges: records.length,
    lastPlayedDate: streakState.lastPlayedDate,
    lastDailyWinDate: streakState.lastDailyWinDate,
    completedChallenges: records,
  };
}

export function loadPlayerStats(): PlayerProfileStats {
  if (!PERSISTENCE_ENABLED) return createEmptyPlayerStats();
  if (typeof window === "undefined") return createEmptyPlayerStats();

  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return createEmptyPlayerStats();
    const parsed = JSON.parse(raw) as Partial<PlayerProfileStats>;
    const records = parsed.completedChallenges ?? [];
    const today = getUtcDateString();
    const stats = recomputeAggregates(
      records,
      {
        currentStreak: parsed.currentStreak ?? 0,
        lastPlayedDate: parsed.lastPlayedDate ?? null,
        lastDailyWinDate: parsed.lastDailyWinDate ?? null,
      },
      today,
    );

    // Persist streak reset after a missed Daily
    if (stats.currentStreak !== (parsed.currentStreak ?? 0)) {
      savePlayerStats(stats);
    }

    return stats;
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

export function recordChallengeResult(
  record: CompletedChallengeRecord,
): PlayerProfileStats {
  if (!PERSISTENCE_ENABLED) {
    return createEmptyPlayerStats();
  }

  const today = getUtcDateString();
  const source = resolveSource(
    {
      ...record,
      source:
        record.source ??
        (record.date === today ? "daily" : "archive"),
    },
    today,
  );

  const stats = loadPlayerStats();

  if (
    stats.completedChallenges.some(
      (item) => item.challengeId === record.challengeId,
    )
  ) {
    return stats;
  }

  const nextRecord: CompletedChallengeRecord = { ...record, source };
  const records = [...stats.completedChallenges, nextRecord];

  let currentStreak = stats.currentStreak;
  let lastPlayedDate = stats.lastPlayedDate;
  let lastDailyWinDate = stats.lastDailyWinDate;

  if (source === "daily") {
    const yesterday = addUtcDays(today, -1);

    if (lastPlayedDate && lastPlayedDate < yesterday) {
      currentStreak = 0;
    }

    if (record.won) {
      if (
        lastDailyWinDate === yesterday ||
        lastPlayedDate === yesterday
      ) {
        currentStreak += 1;
      } else {
        currentStreak = 1;
      }
      lastDailyWinDate = today;
    }

    lastPlayedDate = today;
  }

  const next = recomputeAggregates(
    records,
    { currentStreak, lastPlayedDate, lastDailyWinDate },
    today,
  );
  savePlayerStats(next);
  return next;
}
