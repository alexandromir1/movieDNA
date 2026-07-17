"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { GAME_ROUTES } from "@/lib/game/constants";
import {
  loadPlayerStats,
  type PlayerProfileStats,
} from "@/lib/game/player-stats";

export function ProfileOverview() {
  const [stats, setStats] = useState<PlayerProfileStats>(() =>
    loadPlayerStats(),
  );

  const refresh = useCallback(() => {
    setStats(loadPlayerStats());
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener("moviedna:stats-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("moviedna:stats-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  const isEmpty = stats.totalChallenges === 0;

  return (
    <div className="space-y-6">
      {isEmpty ? (
        <div className="rounded-[12px] border border-white/[0.09] bg-white/[0.03] px-4 py-6 text-center">
          <p className="text-sm text-white/70">
            Сыграй сегодняшний Daily — здесь появится серия и результаты.
          </p>
          <Link
            href={GAME_ROUTES.today}
            className="mt-4 inline-flex h-11 items-center justify-center rounded-[10px] bg-[var(--accent)] px-5 text-sm font-medium text-black transition-all hover:brightness-105"
          >
            К Daily Challenge
          </Link>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard emoji="🔥" label="Текущая серия" value={stats.currentStreak} />
        <StatCard
          emoji="🎬"
          label="Пройдено Daily"
          value={stats.dailyCompleted}
        />
        <StatCard
          emoji="📚"
          label="Пройдено в архиве"
          value={stats.archiveCompleted}
        />
        <StatCard
          emoji="⭐"
          label="Средний Movie Score"
          value={stats.averageMovieScore}
        />
        <StatCard
          emoji="🏆"
          label="Лучший Movie Score"
          value={stats.bestMovieScore}
        />
      </div>
    </div>
  );
}

function StatCard({
  emoji,
  label,
  value,
}: {
  emoji: string;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-[12px] border border-white/[0.09] bg-white/[0.03] px-4 py-5 text-center">
      <p className="text-2xl" aria-hidden>
        {emoji}
      </p>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-white">
        {value}
      </p>
      <p className="mt-1 text-sm text-white/45">{label}</p>
    </div>
  );
}
