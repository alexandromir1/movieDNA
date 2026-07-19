import type { Metadata } from "next";

import { ChallengePlayGate } from "@/components/game/ChallengePlayGate";
import { ChallengeShell } from "@/components/game/ChallengeShell";
import { GameEmptyState } from "@/components/game/GameEmptyState";
import {
  getArchiveChallengeLinks,
  getTodayChallengeBundle,
  resolveRelatedChallengeLinks,
} from "@/lib/content/catalog";
import { resolveMovieRecommendations } from "@/lib/content/recommendations";
import { getUtcDateString } from "@/lib/game/daily";
import { getRequestLocale } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Daily Challenge",
};

export default async function GamePage() {
  const today = getUtcDateString();
  const locale = await getRequestLocale();
  const bundle = getTodayChallengeBundle(today);

  if (!bundle) {
    return (
      <ChallengeShell activeDate={today}>
        <GameEmptyState />
      </ChallengeShell>
    );
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
