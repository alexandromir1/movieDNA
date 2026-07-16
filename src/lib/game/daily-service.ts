import { siteConfig } from "@/config/site";
import { createClient } from "@/lib/supabase/server";

import {
  getDailyDateRange,
  getUsedMovieIdsBeforeDate,
  getUtcDateString,
  isValidDailyDate,
  selectDailyMovieId,
} from "./daily";
import { movieCatalog, type CatalogMovie } from "./movie-catalog";

import type { DailyPuzzle, Movie } from "@/types/game";

function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

function mapDbMovie(row: {
  id: string;
  title: string;
  title_original: string | null;
  year: number;
  frame_urls: unknown;
  sort_order: number;
}): CatalogMovie {
  const parsedFrames = Array.isArray(row.frame_urls)
    ? row.frame_urls.filter((url): url is string => typeof url === "string")
    : [];

  const frameUrls =
    parsedFrames.length > 0
      ? parsedFrames
      : Array.from({ length: 6 }, (_, i) =>
          `https://picsum.photos/seed/kinoshka-${row.id}-f${i + 1}/1280/720`,
        );

  return {
    id: row.id,
    sortOrder: row.sort_order,
    title: row.title,
    titleOriginal: row.title_original,
    year: row.year,
    frameUrls,
    hints: [],
  };
}

async function loadCatalog(): Promise<CatalogMovie[]> {
  if (!isSupabaseConfigured()) {
    return movieCatalog;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("movies")
    .select("id, title, title_original, year, frame_urls, sort_order")
    .order("sort_order", { ascending: true });

  if (error || !data?.length) {
    console.error("[loadCatalog]", error?.message ?? "empty catalog");
    return movieCatalog;
  }

  return data.map(mapDbMovie);
}

function toMovie(catalogMovie: CatalogMovie): Movie {
  return {
    id: catalogMovie.id,
    title: catalogMovie.title,
    titleOriginal: catalogMovie.titleOriginal,
    year: catalogMovie.year,
    frameUrls: catalogMovie.frameUrls,
    hints: catalogMovie.hints,
  };
}

function buildPuzzle(puzzleId: string, date: string, catalogMovie: CatalogMovie): DailyPuzzle {
  return {
    id: puzzleId,
    date,
    movieId: catalogMovie.id,
    movie: toMovie(catalogMovie),
  };
}

function resolveMovieForDate(date: string, catalog: CatalogMovie[]): CatalogMovie {
  const usedBefore = getUsedMovieIdsBeforeDate(date, catalog);
  const movieId = selectDailyMovieId(date, catalog, usedBefore);
  const movie = catalog.find((item) => item.id === movieId);

  if (!movie) {
    throw new Error(`Movie ${movieId} not found in catalog`);
  }

  return movie;
}

async function ensureDailyPuzzleRecord(
  date: string,
  movieId: string,
): Promise<string> {
  if (!isSupabaseConfigured()) {
    return `local-${date}`;
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("ensure_daily_puzzle", {
    puzzle_date: date,
    p_movie_id: movieId,
  });

  if (error || !data) {
    throw error ?? new Error("Failed to ensure daily puzzle");
  }

  return data as string;
}

/** Получить Daily-пазл для UTC-даты (детерминированно для всех пользователей) */
export async function getDailyPuzzle(date: string): Promise<DailyPuzzle | null> {
  if (!isValidDailyDate(date)) {
    return null;
  }

  const catalog = await loadCatalog();
  const movie = resolveMovieForDate(date, catalog);
  const puzzleId = await ensureDailyPuzzleRecord(date, movie.id);

  return buildPuzzle(puzzleId, date, movie);
}

/** Сегодняшний Daily-пазл (UTC) */
export async function getTodayDailyPuzzle(): Promise<DailyPuzzle | null> {
  return getDailyPuzzle(getUtcDateString());
}

/** Список доступных Daily-дат для архива */
export async function getDailyArchiveDates(): Promise<string[]> {
  return getDailyDateRange();
}

/** Проверка доступности архивной даты */
export function isDailyDateAvailable(date: string): boolean {
  return isValidDailyDate(date);
}
