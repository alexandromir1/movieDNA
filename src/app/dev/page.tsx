import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  MovieDnaStudio,
  parseCampaignSection,
  parseDailySection,
  parseStudioMode,
} from "@/components/dev/MovieDnaStudio";
import { loadCampaignSequenceStudioView } from "@/lib/dev/campaign-sequence-view";
import { loadContentStudioData } from "@/lib/dev/content-library";

export const metadata: Metadata = {
  title: "MovieDNA Studio",
};

interface DevPageProps {
  searchParams: Promise<{
    mode?: string;
    level?: string;
    section?: string;
  }>;
}

/**
 * MovieDNA Studio (эволюция /dev).
 * Только local: production → 404. API /api/dev/* тоже закрыты.
 * Без отдельных маршрутов /studio /admin /dev-v2.
 */
export default async function DevPage({ searchParams }: DevPageProps) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const params = await searchParams;
  const data = loadContentStudioData();
  const campaignSequenceView = loadCampaignSequenceStudioView();
  const mode = parseStudioMode(params.mode);

  return (
    <MovieDnaStudio
      data={data}
      campaignSequenceView={campaignSequenceView}
      initialMode={mode}
      initialLevelSlug={params.level?.toLowerCase()}
      initialDailySection={parseDailySection(params.section)}
      initialCampaignSection={parseCampaignSection(params.section)}
    />
  );
}
