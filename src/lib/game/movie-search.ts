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

  const shorter = a.length <= b.length ? a : b;
  const longer = a.length <= b.length ? b : a;
  // Avoid "м" matching "терминатор" via includes()
  if (
    shorter.length >= 3 &&
    longer.includes(shorter) &&
    shorter.length / longer.length >= 0.45
  ) {
    return 0.85;
  }

  if (a.length < 2 || b.length < 2) return 0;

  const aGrams = bigrams(a);
  const bGrams = bigrams(b);
  let intersection = 0;

  for (const gram of aGrams) {
    if (bGrams.has(gram)) intersection++;
  }

  return (2 * intersection) / (aGrams.size + bGrams.size);
}

function scoreTitle(query: string, title: string): number {
  if (!title) return 0;
  if (title === query) return 3;

  const words = title.split(" ");
  const startsWithQuery = title === query || title.startsWith(`${query} `);
  const wordPrefix = words.some((word) => word.startsWith(query));
  const contains = query.length >= 4 && title.includes(query);

  // Short queries: prefix only (avoids noise in a large catalog)
  if (query.length < 4) {
    return startsWithQuery || wordPrefix
      ? 1 + query.length / Math.max(title.length, 1)
      : 0;
  }

  // Shared title prefix («Гарри Поттер…») — equal base, don't punish long titles
  if (startsWithQuery) return 2.1;
  if (wordPrefix) return 1.5 + diceSimilarity(query, title) * 0.3;
  if (contains) return 1.1 + diceSimilarity(query, title) * 0.2;

  const dice = diceSimilarity(query, title);
  // Pure fuzzy only for strong typo-like matches
  return dice >= 0.72 ? dice : 0;
}

function isPlayableMovieId(id: string): boolean {
  return !/^movie-tt\d+/i.test(id);
}

function scoreMovie(query: string, movie: MovieSuggestion): number {
  const ru = normalizeTitle(movie.title);
  const en = movie.titleOriginal ? normalizeTitle(movie.titleOriginal) : "";
  const base = Math.max(scoreTitle(query, ru), scoreTitle(query, en), 0);
  if (base <= 0) return 0;
  // Playable / challenge films slightly above raw IMDb catalog clones
  return base + (isPlayableMovieId(movie.id) ? 0.05 : 0);
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
    .filter(({ score }) => score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const playableDelta =
        Number(isPlayableMovieId(b.movie.id)) -
        Number(isPlayableMovieId(a.movie.id));
      if (playableDelta !== 0) return playableDelta;
      // Earlier film first in a series («Гарри Поттер» → философский камень)
      return a.movie.year - b.movie.year;
    })
    .slice(0, limit)
    .map(({ movie }) => movie);
}
