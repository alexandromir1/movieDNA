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
  title: "Сегодняшний Challenge",
};

export default function GamePage() {
  const today = getUtcDateString();
  const bundle = getTodayChallengeBundle(today);

  if (!bundle) {
    return (
      <ChallengeShell activeDate={today}>
        <div className="mx-auto flex min-h-[44vh] w-full max-w-md flex-col items-center justify-center px-2 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/35">
            Daily Challenge
          </p>
          <h1 className="mt-3 text-xl font-semibold text-white sm:text-2xl">
            Сегодняшний Challenge ещё готовится
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/45">
            Пока можно пройти предыдущие игры — Архив продолжает сессию.
          </p>
          <Link
            href={GAME_ROUTES.archive}
            className="mt-8 inline-flex h-12 w-full max-w-xs items-center justify-center rounded-[10px] bg-[var(--accent)] text-sm font-semibold text-black transition-all duration-200 hover:brightness-105 active:scale-[0.98]"
          >
            Открыть Архив
          </Link>
          <Link
            href={GAME_ROUTES.profile}
            className="mt-3 text-xs text-white/40 underline-offset-2 hover:text-white/70 hover:underline"
          >
            Смотреть профиль
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
