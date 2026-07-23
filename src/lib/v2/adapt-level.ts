import type { Level } from "@/types/content";
import type { ImagePoint, V2Level } from "@/types/v2-content";

/**
 * Адаптер v1 Level (revealRegions) → v2 Level (RevealDefinition → Fragments).
 * Контент тот же файл data/levels/*; меняется только проекция модели.
 * full_image не входит в Fragments — это не шаг Fragments-стратегии.
 */
export function adaptLevelToV2(level: Level): V2Level {
  const pieces = level.revealRegions
    .filter(
      (region) =>
        region.kind !== "full_image" && region.polygon.length >= 3,
    )
    .slice()
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((region) => ({
      id: region.id,
      polygon: region.polygon.map(
        ([x, y]) => [x, y] as ImagePoint,
      ),
    }));

  if (pieces.length === 0) {
    throw new Error(`Level ${level.id} has no fragment pieces after adapt`);
  }

  return {
    id: level.id,
    movieId: level.movieId,
    difficulty: level.difficulty,
    image: level.image,
    width: level.width,
    height: level.height,
    acceptedAnswers: level.acceptedAnswers,
    revealDefinition: {
      kind: "fragments",
      stepCount: pieces.length,
      data: { pieces },
    },
  };
}
