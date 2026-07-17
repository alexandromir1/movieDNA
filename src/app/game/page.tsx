import type { Metadata } from "next";
import Link from "next/link";

import { ChallengePlayGate } from "@/components/game/ChallengePlayGate";
import { ChallengeShell } from "@/components/game/ChallengeShell";
import {
  getArchiveChallengeLinks,
  getTodayChallengeBundle,
  resolveRelatedChallengeLinks,
} from "@/lib/content/catalog";
import { GAME_ROUTES } from "@/lib/game/constants";
import { getUtcDateString } from "@/lib/game/daily";

export const metadata: Metadata = {
  title: "Today's Challenge",
};

export default function GamePage() {
  const today = getUtcDateString();
  const bundle = getTodayChallengeBundle(today);

  if (!bundle) {
    return (
      <ChallengeShell activeDate={today}>
        <div className="flex min-h-[40vh] flex-col items-center justify-center px-2 text-center">
          <p className="text-lg font-medium text-white/80">
            Сегодня новый Challenge ещё не опубликован.
          </p>
          <p className="mt-2 max-w-sm text-sm text-white/40">
            Пока можно пройти предыдущие дни — в архиве твоя история Daily
            Challenge.
          </p>
          <Link
            href={GAME_ROUTES.archive}
            className="mt-7 inline-flex h-12 items-center justify-center rounded-[10px] bg-[var(--accent)] px-7 text-sm font-medium text-black transition-all duration-200 hover:brightness-105 active:scale-[0.98]"
          >
            Перейти в архив
          </Link>
        </div>
      </ChallengeShell>
    );
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
