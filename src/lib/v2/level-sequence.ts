import type { LevelSequence } from "@/types/v2-content";

import {
  getCampaignSequence,
  getDefaultCampaign,
} from "./campaigns";

/**
 * Активная LevelSequence для игрока.
 * Берётся из Campaign (сейчас — Main); Engine получает только sequence.
 */
export function getActiveLevelSequence(): LevelSequence {
  return getCampaignSequence(getDefaultCampaign());
}

/** @deprecated используй getActiveLevelSequence() / Campaign.sequence */
export const V2_LEVEL_SEQUENCE: LevelSequence = getActiveLevelSequence();

export function getSequenceLength(
  sequence: LevelSequence = getActiveLevelSequence(),
): number {
  return sequence.levelIds.length;
}
