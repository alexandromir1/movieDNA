import { getLevelById, getMovieById } from "@/lib/content/catalog";
import { localize } from "@/lib/i18n/localize";
import { DEFAULT_LOCALE } from "@/lib/i18n/types";
import { getDefaultCampaign } from "@/lib/v2/campaigns";
import type { LevelDifficulty } from "@/types/v2-content";

export interface CampaignSequenceStudioRow {
  index: number;
  levelId: string;
  label: string;
  difficulty: LevelDifficulty;
}

export interface CampaignSequenceStudioView {
  id: string;
  name: string;
  description: string;
  levelCount: number;
  difficultyCounts: Record<LevelDifficulty, number>;
  levels: CampaignSequenceStudioRow[];
}

/** Read-only снимок Campaign → Sequence для Studio (без Engine). */
export function loadCampaignSequenceStudioView(): CampaignSequenceStudioView {
  const campaign = getDefaultCampaign();
  const difficultyCounts: Record<LevelDifficulty, number> = {
    easy: 0,
    medium: 0,
    hard: 0,
  };

  const levels: CampaignSequenceStudioRow[] = campaign.sequence.levelIds.map(
    (levelId, index) => {
      const level = getLevelById(levelId);
      const movie = level ? getMovieById(level.movieId) : null;
      const difficulty = (level?.difficulty ?? "medium") as LevelDifficulty;
      difficultyCounts[difficulty] += 1;

      const label = movie
        ? localize(movie.title, DEFAULT_LOCALE)
        : levelId.replace(/^level-/, "");

      return {
        index: index + 1,
        levelId,
        label,
        difficulty,
      };
    },
  );

  return {
    id: campaign.id,
    name: localize(campaign.name, DEFAULT_LOCALE),
    description: localize(campaign.description, DEFAULT_LOCALE),
    levelCount: levels.length,
    difficultyCounts,
    levels,
  };
}
