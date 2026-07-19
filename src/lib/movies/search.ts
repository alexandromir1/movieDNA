import { getMovieSearchCatalog } from "@/lib/content/catalog";
import { localize } from "@/lib/i18n/localize";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/types";
import { searchMoviesLocal } from "@/lib/game/movie-search";
import { createClient } from "@/lib/supabase/server";

import type { MovieSuggestion } from "@/types/game";

const DEFAULT_LIMIT = 8;

function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

function localCatalog(locale: Locale): MovieSuggestion[] {
  return getMovieSearchCatalog().map((movie) => ({
    id: movie.id,
    title: localize(movie.title, locale),
    year: movie.year,
  }));
}

function mapRow(row: {
  id: string;
  title: string;
  title_original: string | null;
  year: number;
}, locale: Locale): MovieSuggestion {
  // Supabase ещё отдаёт плоские поля — выбираем по локали
  const title =
    locale === "en"
      ? row.title_original?.trim() || row.title
      : row.title;
  return {
    id: row.id,
    title,
    year: row.year,
  };
}

export async function searchMovies(
  query: string,
  limit = DEFAULT_LIMIT,
  locale: Locale = DEFAULT_LOCALE,
): Promise<MovieSuggestion[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const fallback = localCatalog(locale);

  if (!isSupabaseConfigured()) {
    return searchMoviesLocal(trimmed, fallback, limit, locale);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_movies", {
    search_query: trimmed,
    result_limit: limit,
  });

  if (error) {
    console.error("[search_movies]", error.message);
    return searchMoviesLocal(trimmed, fallback, limit, locale);
  }

  const rows = Array.isArray(data) ? data : data ? [data] : [];
  if (rows.length === 0) {
    return searchMoviesLocal(trimmed, fallback, limit, locale);
  }

  return rows.map((row) => mapRow(row, locale));
}
