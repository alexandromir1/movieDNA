import type { MovieSuggestion } from "@/types/game";

import { normalizeTitle } from "./title-match";

export function formatMovieLabel(movie: MovieSuggestion): string {
  const original = movie.titleOriginal ? ` / ${movie.titleOriginal}` : "";
  return `${movie.title}${original} (${movie.year})`;
}

function bigrams(text: string): Set<string> {
  const grams = new Set<string>();
  for (let i = 0; i < text.length - 1; i++) {
    grams.add(text.slice(i, i + 2));
  }
  return grams;
}

function diceSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.85;

  const aGrams = bigrams(a);
  const bGrams = bigrams(b);
  let intersection = 0;

  for (const gram of aGrams) {
    if (bGrams.has(gram)) intersection++;
  }

  return (2 * intersection) / (aGrams.size + bGrams.size);
}

function scoreMovie(query: string, movie: MovieSuggestion): number {
  const ru = normalizeTitle(movie.title);
  const en = movie.titleOriginal ? normalizeTitle(movie.titleOriginal) : "";

  const scores = [ru, en]
    .filter(Boolean)
    .map((title) => {
      let score = diceSimilarity(query, title);

      if (title.startsWith(query)) score += 0.6;
      if (title.includes(query)) score += 0.3;
      if (title === query) score += 1;

      return score;
    });

  return Math.max(...scores, 0);
}

/** Локальный fallback-поиск (без Supabase), с базовой нечёткой логикой */
export function searchMoviesLocal(
  query: string,
  catalog: MovieSuggestion[],
  limit = 8,
): MovieSuggestion[] {
  const normalizedQuery = normalizeTitle(query);
  if (!normalizedQuery) return [];

  return catalog
    .map((movie) => ({ movie, score: scoreMovie(normalizedQuery, movie) }))
    .filter(({ score }) => score >= 0.35)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ movie }) => movie);
}
