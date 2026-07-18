import { loadAllMovies, slugFromMovieId } from "@/lib/content/load-fs";

import type {
  Movie,
  MovieRecommendationCategory,
} from "@/types/content";
import type {
  MovieRecommendationCategoryView,
  MovieRecommendationItemView,
} from "@/types/recommendations";

export type {
  MovieRecommendationCategoryView,
  MovieRecommendationItemView,
} from "@/types/recommendations";

const MAX_ITEMS_PER_CATEGORY = 3;

/**
 * Резолв ручных Movie.recommendations → view-model для киномарафона.
 * Без картинок Challenge и без ссылок на игру (анти-спойлер).
 */
export function resolveMovieRecommendations(
  movie: Movie,
): MovieRecommendationCategoryView[] {
  const raw = movie.recommendations;
  if (!raw?.length) return [];

  const moviesById = new Map(loadAllMovies().map((item) => [item.id, item]));
  const categories: MovieRecommendationCategoryView[] = [];

  for (const category of raw as MovieRecommendationCategory[]) {
    if (!category?.title?.trim() || !category.items?.length) continue;

    const items: MovieRecommendationItemView[] = [];
    const seen = new Set<string>();

    for (const entry of category.items) {
      if (items.length >= MAX_ITEMS_PER_CATEGORY) break;
      const movieId = entry.movieId;
      if (!movieId || seen.has(movieId) || movieId === movie.id) continue;
      seen.add(movieId);

      const recommended = moviesById.get(movieId);
      if (!recommended) continue;

      items.push({
        movieId: recommended.id,
        slug: slugFromMovieId(recommended.id),
        title: recommended.title || recommended.titleOriginal || recommended.id,
        titleOriginal: recommended.titleOriginal,
        year: recommended.year,
        note: entry.note?.trim() || null,
      });
    }

    if (items.length === 0) continue;
    categories.push({
      title: category.title.trim(),
      items,
    });
  }

  return categories;
}

export function getMovieBySlug(slug: string): Movie | null {
  const id = slug.startsWith("movie-") ? slug : `movie-${slug}`;
  return loadAllMovies().find((movie) => movie.id === id) ?? null;
}
