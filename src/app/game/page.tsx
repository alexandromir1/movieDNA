import type { Metadata } from "next";

import { ChallengeBoard } from "@/components/game/ChallengeBoard";
import { getTodayChallengeBundle } from "@/lib/content/catalog";

export const metadata: Metadata = {
  title: "Today's Challenge",
};

export default function GamePage() {
  const bundle = getTodayChallengeBundle();

  if (!bundle) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 text-white/50">
        Challenge пока недоступен
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center py-10">
      <ChallengeBoard
        challenge={bundle.challenge}
        level={bundle.level}
        movie={bundle.movie}
      />
    </div>
  );
}
