"use server";

import {
  getBundledLevelById,
  getBundledMovieById,
} from "@/lib/content/bundled-catalog";
import { adaptLevelToV2 } from "@/lib/v2/adapt-level";
import type { Movie } from "@/types/content";
import type { V2Level } from "@/types/v2-content";

export interface V2LevelBundle {
  level: V2Level;
  movie: Movie;
}

/**
 * Контент Level+Movie для v2.
 * Берём из статически импортированного bundled-catalog —
 * так JSON гарантированно попадает в Vercel serverless bundle
 * (в отличие от fs.readdir в runtime).
 */
export async function fetchV2LevelBundle(
  levelId: string,
): Promise<V2LevelBundle | null> {
  try {
    const level = getBundledLevelById(levelId);
    if (!level) return null;
    const movie = getBundledMovieById(level.movieId);
    if (!movie) return null;

    return {
      level: adaptLevelToV2(level),
      movie,
    };
  } catch {
    return null;
  }
}
