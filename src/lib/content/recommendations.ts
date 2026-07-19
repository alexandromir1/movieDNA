import { loadAllMovies, slugFromMovieId } from "@/lib/content/load-fs";
import { localize } from "@/lib/i18n/localize";
import type { LocalizedString } from "@/lib/i18n/types";

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

function asLocalized(
  value: LocalizedString | string | undefined,
): LocalizedString | null {
  if (value == null) return null;
  if (typeof value === "string") {
    const text = value.trim();
    return text ? { ru: text, en: text } : null;
  }
  if (!localize(value, "ru") && !localize(value, "en")) return null;
  return value;
}

/**
 * Резолв ручных Movie.recommendations → view-model для киномарафона.
 * Названия остаются LocalizedString — UI показывает только текущий язык.
 */
export function resolveMovieRecommendations(
  movie: Movie,
): MovieRecommendationCategoryView[] {
  const raw = movie.recommendations;
  if (!raw?.length) return [];

  const moviesById = new Map(loadAllMovies().map((item) => [item.id, item]));
  const categories: MovieRecommendationCategoryView[] = [];

  for (const category of raw as MovieRecommendationCategory[]) {
    const categoryTitle = asLocalized(category.title);
    if (!categoryTitle || !category.items?.length) continue;

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
        title: recommended.title,
        year: recommended.year,
        note: entry.note ? asLocalized(entry.note) : null,
      });
    }

    if (items.length === 0) continue;
    categories.push({
      title: categoryTitle,
      items,
    });
  }

  return categories;
}

export function getMovieBySlug(slug: string): Movie | null {
  const id = slug.startsWith("movie-") ? slug : `movie-${slug}`;
  return loadAllMovies().find((movie) => movie.id === id) ?? null;
}
