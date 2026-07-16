import { siteConfig } from "@/config/site";
import { addUtcDays, getUtcDateString } from "@/lib/game/daily";

import {
  createEmptyStats,
  EMPTY_WIN_DISTRIBUTION,
  type CompletedGameRecord,
  type PlayerStats,
  type WinDistribution,
} from "@/types/stats";

const STATS_STORAGE_KEY = "kinoshka-stats";

export function loadPlayerStats(): PlayerStats {
  if (typeof window === "undefined") return createEmptyStats();

  try {
    const raw = localStorage.getItem(STATS_STORAGE_KEY);
    if (!raw) return createEmptyStats();

    const parsed = JSON.parse(raw) as PlayerStats;
    return normalizeStats(parsed);
  } catch {
    return createEmptyStats();
  }
}

export function savePlayerStats(stats: PlayerStats): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
}

function normalizeStats(stats: Partial<PlayerStats>): PlayerStats {
  return {
    gamesPlayed: stats.gamesPlayed ?? 0,
    gamesWon: stats.gamesWon ?? 0,
    currentStreak: stats.currentStreak ?? 0,
    maxStreak: stats.maxStreak ?? 0,
    winDistribution: { ...EMPTY_WIN_DISTRIBUTION, ...stats.winDistribution },
    completedGames: stats.completedGames ?? [],
  };
}

function clampAttempts(attempts: number): 1 | 2 | 3 | 4 | 5 | 6 {
  return Math.min(6, Math.max(1, attempts)) as 1 | 2 | 3 | 4 | 5 | 6;
}

export function computeWinDistribution(games: CompletedGameRecord[]): WinDistribution {
  const distribution = { ...EMPTY_WIN_DISTRIBUTION };

  for (const game of games) {
    if (game.won) {
      distribution[clampAttempts(game.attempts)]++;
    }
  }

  return distribution;
}

/** Текущая серия: подряд выигранные UTC-дни без пропусков, отсчёт от сегодня назад */
export function computeCurrentStreak(games: CompletedGameRecord[]): number {
  const byDate = new Map(games.map((game) => [game.date, game]));
  let streak = 0;
  let date = getUtcDateString();

  while (date >= siteConfig.dailyLaunchDate) {
    const game = byDate.get(date);

    if (!game) break;
    if (!game.won) break;

    streak++;
    date = addUtcDays(date, -1);
  }

  return streak;
}

/** Лучшая серия побед подряд */
export function computeMaxStreak(games: CompletedGameRecord[]): number {
  if (games.length === 0) return 0;

  const sorted = [...games].sort((a, b) => a.date.localeCompare(b.date));
  let maxStreak = 0;
  let current = 0;
  let prevDate: string | null = null;

  for (const game of sorted) {
    if (!game.won) {
      current = 0;
      prevDate = game.date;
      continue;
    }

    const isConsecutive =
      prevDate === null || addUtcDays(prevDate, 1) === game.date;

    current = isConsecutive ? current + 1 : 1;
    maxStreak = Math.max(maxStreak, current);
    prevDate = game.date;
  }

  return maxStreak;
}

export function deriveStats(completedGames: CompletedGameRecord[]): PlayerStats {
  const gamesWon = completedGames.filter((game) => game.won).length;

  return {
    gamesPlayed: completedGames.length,
    gamesWon,
    currentStreak: computeCurrentStreak(completedGames),
    maxStreak: computeMaxStreak(completedGames),
    winDistribution: computeWinDistribution(completedGames),
    completedGames,
  };
}

export function recordGameResult(
  date: string,
  won: boolean,
  attempts: number,
): PlayerStats {
  const stats = loadPlayerStats();

  if (stats.completedGames.some((game) => game.date === date)) {
    return stats;
  }

  const completedGames = [...stats.completedGames, { date, won, attempts }];
  const nextStats = deriveStats(completedGames);

  savePlayerStats(nextStats);
  window.dispatchEvent(new Event("kinoshka:stats-updated"));
  return nextStats;
}
