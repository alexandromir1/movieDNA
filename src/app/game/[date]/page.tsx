import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ChallengePlayGate } from "@/components/game/ChallengePlayGate";
import { ChallengeShell } from "@/components/game/ChallengeShell";
import {
  getArchiveChallengeLinks,
  getChallengeBundleByDate,
  resolveRelatedChallengeLinks,
} from "@/lib/content/catalog";
import { resolveMovieRecommendations } from "@/lib/content/recommendations";
import { getRequestLocale } from "@/lib/i18n/server";

interface GameDatePageProps {
  params: Promise<{ date: string }>;
}

export async function generateMetadata({
  params,
}: GameDatePageProps): Promise<Metadata> {
  const { date } = await params;
  return { title: `Archive · ${date}` };
}

export default async function GameDatePage({ params }: GameDatePageProps) {
  const { date } = await params;
  const locale = await getRequestLocale();
  const bundle = getChallengeBundleByDate(date);

  if (!bundle) {
    notFound();
  }

  const relatedChallenges = resolveRelatedChallengeLinks(
    bundle.challenge.relatedChallenges,
  );
  const archivePool = getArchiveChallengeLinks();
  const recommendations = resolveMovieRecommendations(bundle.movie);

  return (
    <ChallengeShell activeDate={bundle.challenge.date}>
      <ChallengePlayGate
        challenge={bundle.challenge}
        level={bundle.level}
        movie={bundle.movie}
        recommendations={recommendations}
        relatedChallenges={relatedChallenges}
        archivePool={archivePool}
      />
    </ChallengeShell>
  );
}
