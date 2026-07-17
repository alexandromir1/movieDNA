import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ChallengePlayGate } from "@/components/game/ChallengePlayGate";
import { ChallengeShell } from "@/components/game/ChallengeShell";
import {
  getArchiveChallengeLinks,
  getChallengeBundleByDate,
  resolveRelatedChallengeLinks,
} from "@/lib/content/catalog";

interface GameDatePageProps {
  params: Promise<{ date: string }>;
}

export async function generateMetadata({
  params,
}: GameDatePageProps): Promise<Metadata> {
  const { date } = await params;
  return { title: `Challenge ${date}` };
}

export default async function GameDatePage({ params }: GameDatePageProps) {
  const { date } = await params;
  const bundle = getChallengeBundleByDate(date);

  if (!bundle) {
    notFound();
  }

  const relatedChallenges = resolveRelatedChallengeLinks(
    bundle.challenge.relatedChallenges,
  );
  const archivePool = getArchiveChallengeLinks();

  return (
    <ChallengeShell activeDate={bundle.challenge.date}>
      <ChallengePlayGate
        challenge={bundle.challenge}
        level={bundle.level}
        movie={bundle.movie}
        relatedChallenges={relatedChallenges}
        archivePool={archivePool}
      />
    </ChallengeShell>
  );
}
