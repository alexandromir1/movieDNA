"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ChallengeBoard } from "@/components/game/ChallengeBoard";
import type { NextChallengeLink } from "@/components/game/WhatsNextBlock";
import { GAME_ROUTES } from "@/lib/game/constants";
import { getUtcDateString } from "@/lib/game/daily";
import { loadPlayerStats } from "@/lib/game/player-stats";
import { loadGameSession } from "@/lib/game/session-storage";

import type { Challenge, Level, Movie } from "@/types/content";

interface ChallengePlayGateProps {
  challenge: Challenge;
  level: Level;
  movie: Movie;
  relatedChallenges?: NextChallengeLink[];
  archivePool?: NextChallengeLink[];
}

/**
 * Архив: после победы/поражения повтор недоступен.
 * Если сессия ещё есть — показываем результат через ChallengeBoard.
 * Если сессии нет, но запись в stats есть — показываем «уже пройдено».
 */
export function ChallengePlayGate({
  challenge,
  level,
  movie,
  relatedChallenges = [],
  archivePool = [],
}: ChallengePlayGateProps) {
  const [blocked, setBlocked] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const today = getUtcDateString();
    const isArchive = challenge.date < today;
    if (!isArchive) {
      setReady(true);
      return;
    }

    const statsDone = loadPlayerStats().completedChallenges.some(
      (entry) =>
        entry.challengeId === challenge.id || entry.date === challenge.date,
    );
    const session = loadGameSession(challenge.id);
    const sessionDone =
      session?.state === "COMPLETED" || session?.state === "LOST";

    if (statsDone && !sessionDone) {
      setBlocked(true);
    }
    setReady(true);
  }, [challenge.date, challenge.id]);

  if (!ready) {
    return (
      <p className="text-sm text-white/40" aria-hidden>
        …
      </p>
    );
  }

  if (blocked) {
    return (
      <div className="mx-auto max-w-md px-4 text-center">
        <p className="text-lg text-white/80">Эта игра уже пройдена</p>
        <p className="mt-2 text-sm text-white/40">
          Архивные Challenge можно пройти только один раз.
        </p>
        <Link
          href={GAME_ROUTES.archive}
          className="mt-6 inline-block text-sm text-white/55 underline-offset-2 hover:text-white/80 hover:underline"
        >
          ← Назад в архив
        </Link>
      </div>
    );
  }

  return (
    <ChallengeBoard
      challenge={challenge}
      level={level}
      movie={movie}
      relatedChallenges={relatedChallenges}
      archivePool={archivePool}
    />
  );
}
