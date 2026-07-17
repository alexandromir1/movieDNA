"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { loadPlayerStats } from "@/lib/game/player-stats";

export interface NextChallengeLink {
  challengeId: string;
  date: string;
}

interface WhatsNextBlockProps {
  /** Related archive challenges from challenge.relatedChallenges */
  related: NextChallengeLink[];
  /** All archive candidates for the random button */
  archivePool: NextChallengeLink[];
  /** Current challenge — exclude from random */
  currentChallengeId: string;
}

/**
 * Post-finish block: related (from JSON) + one random Archive challenge.
 * Shown after Daily and Archive — keeps the player in the loop.
 */
export function WhatsNextBlock({
  related,
  archivePool,
  currentChallengeId,
}: WhatsNextBlockProps) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const ids = new Set(
      loadPlayerStats().completedChallenges.map((record) => record.challengeId),
    );
    setCompletedIds(ids);
  }, []);

  const relatedPlayable = related.filter(
    (item) =>
      item.challengeId !== currentChallengeId &&
      !completedIds.has(item.challengeId),
  );

  const randomTarget = useMemo(() => {
    const pool = archivePool.filter(
      (item) =>
        item.challengeId !== currentChallengeId &&
        !completedIds.has(item.challengeId),
    );
    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)] ?? null;
  }, [archivePool, completedIds, currentChallengeId]);

  if (relatedPlayable.length === 0 && !randomTarget) {
    return null;
  }

  return (
    <div className="mt-6 w-full max-w-md rounded-[12px] border border-white/[0.09] bg-white/[0.03] px-4 py-4 text-left">
      <p className="text-sm font-medium text-white">Что пройти дальше?</p>

      {relatedPlayable.length > 0 && (
        <div className="mt-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">
            Похожие Challenge
          </p>
          <ul className="mt-2 space-y-1.5">
            {relatedPlayable.map((item) => (
              <li key={item.challengeId}>
                <Link
                  href={`/game/${item.date}`}
                  className="flex items-center justify-between rounded-[8px] border border-white/[0.08] px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/[0.05]"
                >
                  <span className="font-mono text-xs">{item.date}</span>
                  <span className="text-xs text-white/40">Играть →</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {randomTarget && (
        <div className="mt-4">
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">
            Случайный Challenge
          </p>
          <Link
            href={`/game/${randomTarget.date}`}
            className="mt-2 inline-flex h-12 w-full items-center justify-center rounded-[10px] border border-white/[0.12] bg-white/[0.04] text-sm font-medium text-white transition-all duration-200 hover:border-white/25 hover:bg-white/[0.07] active:scale-[0.98]"
          >
            Случайный Challenge
          </Link>
        </div>
      )}
    </div>
  );
}
