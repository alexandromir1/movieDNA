import mainCampaignJson from "../../../data/campaigns/main.json";

import type { Campaign, LevelSequence } from "@/types/v2-content";

/**
 * Каталог кампаний (контент).
 * Engine не импортирует этот модуль с привязкой к «main» —
 * application передаёт sequence явно.
 */

const MAIN_CAMPAIGN: Campaign = {
  id: mainCampaignJson.id,
  name: mainCampaignJson.name,
  description: mainCampaignJson.description,
  sequence: {
    levelIds: mainCampaignJson.sequence.levelIds,
  },
};

const CAMPAIGNS_BY_ID: Record<string, Campaign> = {
  [MAIN_CAMPAIGN.id]: MAIN_CAMPAIGN,
};

/** Пока единственная активная кампания продукта. */
export const DEFAULT_CAMPAIGN_ID = MAIN_CAMPAIGN.id;

export function listCampaigns(): Campaign[] {
  return Object.values(CAMPAIGNS_BY_ID);
}

export function getCampaignById(id: string): Campaign | null {
  return CAMPAIGNS_BY_ID[id] ?? null;
}

export function getDefaultCampaign(): Campaign {
  return MAIN_CAMPAIGN;
}

export function getCampaignSequence(campaign: Campaign): LevelSequence {
  return campaign.sequence;
}
