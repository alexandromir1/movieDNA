import { getMovieSearchCatalog } from "@/lib/content/catalog";
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

function localCatalog(): MovieSuggestion[] {
  return getMovieSearchCatalog().map((movie) => ({
    id: movie.id,
    title: movie.title,
    titleOriginal: movie.titleOriginal,
    year: movie.year,
  }));
}

function mapRow(row: {
  id: string;
  title: string;
  title_original: string | null;
  year: number;
}): MovieSuggestion {
  return {
    id: row.id,
    title: row.title,
    titleOriginal: row.title_original,
    year: row.year,
  };
}

export async function searchMovies(
  query: string,
  limit = DEFAULT_LIMIT,
): Promise<MovieSuggestion[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const fallback = localCatalog();

  if (!isSupabaseConfigured()) {
    return searchMoviesLocal(trimmed, fallback, limit);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_movies", {
    search_query: trimmed,
    result_limit: limit,
  });

  if (error) {
    console.error("[search_movies]", error.message);
    return searchMoviesLocal(trimmed, fallback, limit);
  }

  const rows = Array.isArray(data) ? data : data ? [data] : [];
  if (rows.length === 0) {
    return searchMoviesLocal(trimmed, fallback, limit);
  }

  return rows.map(mapRow);
}
