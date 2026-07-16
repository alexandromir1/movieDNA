"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { loadPlayerStats } from "@/lib/game/player-stats";
import { loadGameSession } from "@/lib/game/session-storage";

export type ArchivePlayStatus = "available" | "in_progress" | "won" | "lost";

export interface ArchiveListItem {
  date: string;
  challengeId: string;
}

interface PlayerArchiveListProps {
  items: ArchiveListItem[];
}

const STATUS_LABEL: Record<ArchivePlayStatus, string> = {
  available: "Играть",
  in_progress: "Продолжить",
  won: "Пройдено",
  lost: "Пройдено",
};

function resolveStatus(item: ArchiveListItem): ArchivePlayStatus {
  const stats = loadPlayerStats();
  const record = stats.completedChallenges.find(
    (entry) =>
      entry.challengeId === item.challengeId || entry.date === item.date,
  );
  if (record) return record.won ? "won" : "lost";

  const session = loadGameSession(item.challengeId);
  if (!session) return "available";
  if (session.state === "COMPLETED") return "won";
  if (session.state === "LOST") return "lost";
  if (
    session.startedAt ||
    session.openedRegionCount > 0 ||
    session.guesses.length > 0
  ) {
    return "in_progress";
  }
  return "available";
}

export function PlayerArchiveList({ items }: PlayerArchiveListProps) {
  const [statuses, setStatuses] = useState<Record<string, ArchivePlayStatus>>(
    {},
  );

  useEffect(() => {
    const refresh = () => {
      const updated: Record<string, ArchivePlayStatus> = {};
      for (const item of items) {
        updated[item.challengeId] = resolveStatus(item);
      }
      setStatuses(updated);
    };

    refresh();
    window.addEventListener("moviedna:stats-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("moviedna:stats-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [items]);

  if (items.length === 0) {
    return <p className="text-sm text-white/35">Пока нет прошедших игр</p>;
  }

  return (
    <ul className="divide-y divide-white/10 border border-white/10">
      {items.map((item) => {
        const status = statuses[item.challengeId] ?? "available";
        const finished = status === "won" || status === "lost";

        return (
          <li key={item.challengeId}>
            {finished ? (
              <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm opacity-50">
                <p className="font-mono text-sm text-white/60">{item.date}</p>
                <span className="text-xs text-white/35">
                  {STATUS_LABEL[status]} · повтор недоступен
                </span>
              </div>
            ) : (
              <Link
                href={`/game/${item.date}`}
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm transition-colors hover:bg-white/5"
              >
                <p className="font-mono text-sm text-white/80">{item.date}</p>
                <span className="text-xs text-white/35">
                  {STATUS_LABEL[status]} →
                </span>
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
