import type { Metadata } from "next";

import { ChallengePlayGate } from "@/components/game/ChallengePlayGate";
import { ChallengeShell } from "@/components/game/ChallengeShell";
import { getTodayChallengeBundle } from "@/lib/content/catalog";
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
          <p className="text-white/50">На сегодня Challenge ещё не назначен</p>
          <p className="mt-2 text-sm text-white/30">
            Выбери прошедший день в списке справа
          </p>
        </div>
      </ChallengeShell>
    );
  }

  return (
    <ChallengeShell activeDate={bundle.challenge.date}>
      <ChallengePlayGate
        challenge={bundle.challenge}
        level={bundle.level}
        movie={bundle.movie}
      />
    </ChallengeShell>
  );
}
