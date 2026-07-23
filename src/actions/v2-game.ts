"use server";

import { getLevelById, getMovieById } from "@/lib/content/catalog";
import { adaptLevelToV2 } from "@/lib/v2/adapt-level";
import type { Movie } from "@/types/content";
import type { V2Level } from "@/types/v2-content";

export interface V2LevelBundle {
  level: V2Level;
  movie: Movie;
}

/** Контент Level+Movie из существующего каталога (data/levels + data/movies). */
export async function fetchV2LevelBundle(
  levelId: string,
): Promise<V2LevelBundle | null> {
  const level = getLevelById(levelId);
  if (!level) return null;
  const movie = getMovieById(level.movieId);
  if (!movie) return null;

  return {
    level: adaptLevelToV2(level),
    movie,
  };
}
