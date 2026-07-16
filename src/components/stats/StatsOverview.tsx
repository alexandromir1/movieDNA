"use client";

import { useCallback, useEffect, useState } from "react";

import { Card } from "@/components/ui/Card";
import {
  loadPlayerStats,
  type PlayerProfileStats,
} from "@/lib/game/player-stats";

export function StatsOverview() {
  const [stats, setStats] = useState<PlayerProfileStats>(() => loadPlayerStats());

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

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Сыграно" value={stats.gamesPlayed} />
        <StatCard label="Побед" value={stats.gamesWon} />
        <StatCard label="Текущий стрик" value={stats.currentStreak} />
        <StatCard label="Лучший стрик" value={stats.maxStreak} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Процент побед" value={`${stats.winRate}%`} />
        <StatCard label="Средний Movie Score" value={stats.averageMovieScore} />
        <StatCard
          label="Среднее Reveal"
          value={stats.averageOpenedRegions}
        />
        <StatCard label="Лучший Score" value={stats.bestMovieScore} />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <Card className="text-center">
      <p className="text-3xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-sm text-white/40">{label}</p>
    </Card>
  );
}
