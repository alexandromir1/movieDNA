"use client";

import { useEffect, useState } from "react";

import { ChallengeBoard } from "@/components/game/ChallengeBoard";
import type { NextChallengeLink } from "@/components/game/WhatsNextBlock";
import type { MovieRecommendationCategoryView } from "@/types/recommendations";
import { ensureArchiveReviewSession } from "@/lib/game/archive-review";
import { getUtcDateString } from "@/lib/game/daily";

import type { Challenge, Level, Movie } from "@/types/content";

interface ChallengePlayGateProps {
  challenge: Challenge;
  level: Level;
  movie: Movie;
  recommendations?: MovieRecommendationCategoryView[];
  relatedChallenges?: NextChallengeLink[];
  archivePool?: NextChallengeLink[];
}

/**
 * Архив: повторно играть нельзя, но пройденный Challenge можно открыть снова —
 * результат, счёт, картинка и подборка.
 */
export function ChallengePlayGate({
  challenge,
  level,
  movie,
  recommendations = [],
  relatedChallenges = [],
  archivePool = [],
}: ChallengePlayGateProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const today = getUtcDateString();
    if (challenge.date < today) {
      ensureArchiveReviewSession(challenge);
    }
    setReady(true);
  }, [challenge]);

  if (!ready) {
    return (
      <p className="text-sm text-white/40" aria-hidden>
        …
      </p>
    );
  }

  return (
    <ChallengeBoard
      challenge={challenge}
      level={level}
      movie={movie}
      recommendations={recommendations}
      relatedChallenges={relatedChallenges}
      archivePool={archivePool}
    />
  );
}
