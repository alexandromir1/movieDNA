import { REVEAL_REGION_COUNT } from "@/config/economy";

import type { StoredAnalyticsEvent } from "./local-store";

export type DifficultyBand = "easy" | "normal" | "hard" | "unknown";

export interface MovieMetricRow {
  movieKey: string;
  movieId: string | null;
  movieTitle: string;
  movieYear: number | null;
  plays: number;
  completed: number;
  failed: number;
  abandoned: number;
  avgRegions: number;
  avgAttempts: number;
  avgSeconds: number | null;
  completionRate: number;
  /** Средний регион «понял» (moment_of_recognition). */
  avgRecognizedAt: number | null;
  /** Средний регион при верном ответе / финише. */
  avgGuessedAt: number | null;
  /** recognized − guessed; отрицательное = узнали раньше, чем ответили. */
  recognitionGap: number | null;
  difficulty: DifficultyBand;
}

export interface RegionShare {
  regionIndex: number;
  count: number;
  share: number;
}

export interface DropOffStep {
  label: string;
  regionIndex: number | null;
  count: number;
  shareOfStarted: number;
}

export interface RecognitionBucket {
  label: string;
  regionIndex: number | null;
  count: number;
  share: number;
}

export interface AnalyticsDashboardSummary {
  eventCount: number;
  started: number;
  completed: number;
  failed: number;
  abandoned: number;
  completionRate: number;
  averageRegions: number | null;
  averageHints: number | null;
  averageAttempts: number | null;
  averageTimeSeconds: number | null;
  /** На каком числе открытых регионов закончили (win/lose). */
  regionDistribution: RegionShare[];
  /** Воронка: started → открыли region N. */
  dropOff: DropOffStep[];
  movies: MovieMetricRow[];
  topHardest: MovieMetricRow[];
  topEasiest: MovieMetricRow[];
  mostAbandoned: MovieMetricRow[];
  recognition: RecognitionBucket[];
  recognitionVsActual: MovieMetricRow[];
}

function num(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function str(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  return null;
}

function movieKey(properties: StoredAnalyticsEvent["properties"]): string {
  return (
    str(properties.movieId) ??
    str(properties.movieTitle) ??
    str(properties.challengeId) ??
    "unknown"
  );
}

function movieTitle(properties: StoredAnalyticsEvent["properties"]): string {
  return (
    str(properties.movieTitle) ??
    str(properties.movieId) ??
    str(properties.challengeId) ??
    "Unknown"
  );
}

function avg(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, n) => sum + n, 0) / values.length;
}

function round1(value: number | null): number | null {
  if (value == null) return null;
  return Math.round(value * 10) / 10;
}

function difficultyBand(
  completionRate: number,
  avgRegions: number,
  decided: number,
): DifficultyBand {
  if (decided < 1) return "unknown";
  if (completionRate >= 0.7 && avgRegions <= 2.5) return "easy";
  if (completionRate <= 0.4 || avgRegions >= 4) return "hard";
  return "normal";
}

interface Acc {
  movieId: string | null;
  movieTitle: string;
  movieYear: number | null;
  started: number;
  completed: number;
  failed: number;
  abandoned: number;
  regions: number[];
  attempts: number[];
  seconds: number[];
  recognizedAt: number[];
  guessedAt: number[];
}

/**
 * Агрегаты для /analytics/dev из локального лога событий.
 */
export function buildAnalyticsDashboard(
  events: StoredAnalyticsEvent[],
  topN = 8,
): AnalyticsDashboardSummary {
  const byMovie = new Map<string, Acc>();
  const finishRegionCounts = new Map<number, number>();
  const openedRegionReach = new Map<number, Set<string>>();
  const challengeMovie = new Map<string, string>();
  /** challengeId → последний known finish regions (для gap). */
  const challengeGuessedAt = new Map<string, number>();
  const challengeRecognizedAt = new Map<string, number>();

  for (let i = 1; i <= REVEAL_REGION_COUNT; i += 1) {
    finishRegionCounts.set(i, 0);
    openedRegionReach.set(i, new Set());
  }

  function ensure(event: StoredAnalyticsEvent): Acc {
    const key = movieKey(event.properties);
    let row = byMovie.get(key);
    if (!row) {
      row = {
        movieId: str(event.properties.movieId),
        movieTitle: movieTitle(event.properties),
        movieYear: num(event.properties.movieYear),
        started: 0,
        completed: 0,
        failed: 0,
        abandoned: 0,
        regions: [],
        attempts: [],
        seconds: [],
        recognizedAt: [],
        guessedAt: [],
      };
      byMovie.set(key, row);
    }
    const challengeId = str(event.properties.challengeId);
    if (challengeId) challengeMovie.set(challengeId, key);
    return row;
  }

  let started = 0;
  let completed = 0;
  let failed = 0;
  let abandoned = 0;
  const finishedRegions: number[] = [];
  const finishedHints: number[] = [];
  const finishedAttempts: number[] = [];
  const finishedSeconds: number[] = [];
  const recognitionCounts = new Map<
    string,
    { regionIndex: number | null; count: number }
  >();
  const startSessions = new Set<string>();

  for (const event of events) {
    const props = event.properties;
    const challengeId = str(props.challengeId);

    switch (event.name) {
      case "challenge_started": {
        started += 1;
        ensure(event).started += 1;
        if (challengeId) startSessions.add(challengeId);
        break;
      }
      case "challenge_completed": {
        completed += 1;
        const row = ensure(event);
        row.completed += 1;
        const regions = num(props.regionsOpened) ?? num(props.openedRegionCount);
        const hints = num(props.hintsUsed) ?? regions;
        const attempts = num(props.attempts) ?? num(props.attemptCount);
        const seconds = num(props.secondsPlayed);
        if (regions != null) {
          row.regions.push(regions);
          row.guessedAt.push(regions);
          finishedRegions.push(regions);
          const bucket = Math.min(
            REVEAL_REGION_COUNT,
            Math.max(1, Math.round(regions)),
          );
          finishRegionCounts.set(
            bucket,
            (finishRegionCounts.get(bucket) ?? 0) + 1,
          );
          if (challengeId) challengeGuessedAt.set(challengeId, regions);
        }
        if (hints != null) finishedHints.push(hints);
        if (attempts != null) {
          row.attempts.push(attempts);
          finishedAttempts.push(attempts);
        }
        if (seconds != null) {
          row.seconds.push(seconds);
          finishedSeconds.push(seconds);
        }
        break;
      }
      case "challenge_failed": {
        failed += 1;
        const row = ensure(event);
        row.failed += 1;
        const regions = num(props.regionsOpened) ?? num(props.openedRegionCount);
        const hints = num(props.hintsUsed) ?? regions;
        const attempts = num(props.attempts) ?? num(props.attemptCount);
        const seconds = num(props.secondsPlayed);
        if (regions != null) {
          row.regions.push(regions);
          finishedRegions.push(regions);
          const bucket = Math.min(
            REVEAL_REGION_COUNT,
            Math.max(1, Math.round(regions)),
          );
          finishRegionCounts.set(
            bucket,
            (finishRegionCounts.get(bucket) ?? 0) + 1,
          );
        }
        if (hints != null) finishedHints.push(hints);
        if (attempts != null) {
          row.attempts.push(attempts);
          finishedAttempts.push(attempts);
        }
        if (seconds != null) {
          row.seconds.push(seconds);
          finishedSeconds.push(seconds);
        }
        break;
      }
      case "challenge_abandoned": {
        abandoned += 1;
        const row = ensure(event);
        row.abandoned += 1;
        const seconds = num(props.secondsPlayed);
        if (seconds != null) {
          row.seconds.push(seconds);
          finishedSeconds.push(seconds);
        }
        break;
      }
      case "region_opened":
      case "hint_used": {
        ensure(event);
        const regionIndex = num(props.regionIndex);
        if (regionIndex == null || !challengeId) break;
        const idx = Math.min(
          REVEAL_REGION_COUNT,
          Math.max(1, Math.round(regionIndex)),
        );
        // Unique sessions that reached this region (and all lower via cascade).
        for (let r = 1; r <= idx; r += 1) {
          openedRegionReach.get(r)?.add(challengeId);
        }
        break;
      }
      case "correct_guess": {
        ensure(event);
        const regions = num(props.openedRegionCount) ?? num(props.regionsOpened);
        if (regions != null && challengeId) {
          challengeGuessedAt.set(challengeId, regions);
          const key = challengeMovie.get(challengeId) ?? movieKey(props);
          const row = byMovie.get(key);
          if (row && !row.guessedAt.includes(regions)) {
            // prefer completed event; still record if only correct_guess
            row.guessedAt.push(regions);
          }
        }
        break;
      }
      case "moment_of_recognition": {
        ensure(event);
        const regionIndex = num(props.regionIndex);
        const answer = str(props.answer);
        const key =
          answer === "never" || regionIndex == null
            ? "never"
            : `r${regionIndex}`;
        const prev = recognitionCounts.get(key);
        if (prev) prev.count += 1;
        else recognitionCounts.set(key, { regionIndex, count: 1 });
        if (regionIndex != null) {
          const row = ensure(event);
          row.recognizedAt.push(regionIndex);
          if (challengeId) challengeRecognizedAt.set(challengeId, regionIndex);
        }
        break;
      }
      default:
        break;
    }
  }

  // Pair recognition vs guess per challenge → movie averages already in Acc.
  for (const [challengeId, recognized] of challengeRecognizedAt) {
    const guessed = challengeGuessedAt.get(challengeId);
    const key = challengeMovie.get(challengeId);
    if (!key || guessed == null) continue;
    const row = byMovie.get(key);
    if (!row) continue;
    // already pushed individually; gap computed from avgs
    void recognized;
  }

  const resolved = started > 0 ? started : completed + failed + abandoned;
  const completionRate =
    resolved > 0
      ? completed / resolved
      : completed + failed > 0
        ? completed / (completed + failed)
        : 0;

  const finishTotal = [...finishRegionCounts.values()].reduce(
    (sum, n) => sum + n,
    0,
  );

  const regionDistribution: RegionShare[] = Array.from(
    { length: REVEAL_REGION_COUNT },
    (_, i) => {
      const regionIndex = i + 1;
      const count = finishRegionCounts.get(regionIndex) ?? 0;
      return {
        regionIndex,
        count,
        share: finishTotal > 0 ? count / finishTotal : 0,
      };
    },
  );

  const funnelStarted = Math.max(started, startSessions.size);
  const dropOff: DropOffStep[] = [
    {
      label: "Started",
      regionIndex: null,
      count: funnelStarted,
      shareOfStarted: funnelStarted > 0 ? 1 : 0,
    },
    ...Array.from({ length: REVEAL_REGION_COUNT }, (_, i) => {
      const regionIndex = i + 1;
      const count = openedRegionReach.get(regionIndex)?.size ?? 0;
      return {
        label: `Opened region ${regionIndex}`,
        regionIndex,
        count,
        shareOfStarted: funnelStarted > 0 ? count / funnelStarted : 0,
      };
    }),
  ];

  const rows: MovieMetricRow[] = [...byMovie.entries()].map(([key, row]) => {
    const plays = Math.max(
      row.started,
      row.completed + row.failed + row.abandoned,
    );
    const decided = row.completed + row.failed;
    const avgRegions = round1(avg(row.regions)) ?? 0;
    const rate = decided > 0 ? row.completed / decided : 0;
    const avgRecognizedAt = round1(avg(row.recognizedAt));
    const avgGuessedAt = round1(avg(row.guessedAt));
    const recognitionGap =
      avgRecognizedAt != null && avgGuessedAt != null
        ? round1(avgRecognizedAt - avgGuessedAt)
        : null;

    return {
      movieKey: key,
      movieId: row.movieId,
      movieTitle: row.movieTitle,
      movieYear: row.movieYear,
      plays,
      completed: row.completed,
      failed: row.failed,
      abandoned: row.abandoned,
      avgRegions,
      avgAttempts: round1(avg(row.attempts)) ?? 0,
      avgSeconds: round1(avg(row.seconds)),
      completionRate: rate,
      avgRecognizedAt,
      avgGuessedAt,
      recognitionGap,
      difficulty: difficultyBand(rate, avgRegions, decided),
    };
  });

  const moviesSorted = [...rows].sort((a, b) =>
    a.movieTitle.localeCompare(b.movieTitle, "en"),
  );

  const withFinish = rows.filter((row) => row.completed + row.failed > 0);

  const topHardest = [...withFinish]
    .sort((a, b) => {
      const rateDiff = a.completionRate - b.completionRate;
      if (Math.abs(rateDiff) > 0.001) return rateDiff;
      return b.avgRegions - a.avgRegions;
    })
    .slice(0, topN);

  const topEasiest = [...withFinish]
    .sort((a, b) => {
      const rateDiff = b.completionRate - a.completionRate;
      if (Math.abs(rateDiff) > 0.001) return rateDiff;
      return a.avgRegions - b.avgRegions;
    })
    .slice(0, topN);

  const mostAbandoned = [...rows]
    .filter((row) => row.abandoned > 0)
    .sort((a, b) => b.abandoned - a.abandoned || b.plays - a.plays)
    .slice(0, topN);

  const recognitionVsActual = [...rows]
    .filter(
      (row) => row.avgRecognizedAt != null && row.avgGuessedAt != null,
    )
    .sort(
      (a, b) =>
        Math.abs(b.recognitionGap ?? 0) - Math.abs(a.recognitionGap ?? 0),
    );

  const recognitionTotal = [...recognitionCounts.values()].reduce(
    (sum, item) => sum + item.count,
    0,
  );

  const recognition: RecognitionBucket[] = [...recognitionCounts.entries()]
    .map(([key, item]) => ({
      label:
        key === "never" || item.regionIndex == null
          ? "Never / end"
          : `Region ${item.regionIndex}`,
      regionIndex: item.regionIndex,
      count: item.count,
      share: recognitionTotal > 0 ? item.count / recognitionTotal : 0,
    }))
    .sort((a, b) => {
      if (a.regionIndex == null && b.regionIndex != null) return 1;
      if (b.regionIndex == null && a.regionIndex != null) return -1;
      return (a.regionIndex ?? 99) - (b.regionIndex ?? 99);
    });

  return {
    eventCount: events.length,
    started,
    completed,
    failed,
    abandoned,
    completionRate,
    averageRegions: round1(avg(finishedRegions)),
    averageHints: round1(
      avg(finishedHints.length ? finishedHints : finishedRegions),
    ),
    averageAttempts: round1(avg(finishedAttempts)),
    averageTimeSeconds: round1(avg(finishedSeconds)),
    regionDistribution,
    dropOff,
    movies: moviesSorted,
    topHardest,
    topEasiest,
    mostAbandoned,
    recognition,
    recognitionVsActual,
  };
}

export function formatSeconds(value: number | null): string {
  if (value == null) return "—";
  if (value < 60) return `${Math.round(value)}s`;
  const mins = Math.floor(value / 60);
  const secs = Math.round(value % 60);
  return `${mins}m ${secs}s`;
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 1000) / 10}%`;
}

export function formatRegion(value: number | null): string {
  if (value == null) return "—";
  return `R${Math.round(value * 10) / 10}`;
}

export function difficultyLabel(band: DifficultyBand): string {
  switch (band) {
    case "easy":
      return "Very easy";
    case "normal":
      return "Normal";
    case "hard":
      return "Too hard";
    default:
      return "—";
  }
}
