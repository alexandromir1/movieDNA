"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  resolveChallengePlayStatus,
  type ChallengePlayStatus,
} from "@/lib/game/play-status";

export interface ArchiveListItem {
  date: string;
  challengeId: string;
}

interface PlayerArchiveListProps {
  items: ArchiveListItem[];
}

const STATUS_LABEL: Record<ChallengePlayStatus, string> = {
  available: "Играть",
  in_progress: "Продолжить",
  won: "Пройдено",
  lost: "Пройдено",
};

export function PlayerArchiveList({ items }: PlayerArchiveListProps) {
  const [statuses, setStatuses] = useState<Record<string, ChallengePlayStatus>>(
    {},
  );

  useEffect(() => {
    const refresh = () => {
      const updated: Record<string, ChallengePlayStatus> = {};
      for (const item of items) {
        updated[item.challengeId] = resolveChallengePlayStatus(item);
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
    <ul className="divide-y divide-white/[0.07] overflow-hidden rounded-[12px] border border-white/[0.09] bg-white/[0.02]">
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
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm transition-colors duration-200 hover:bg-white/[0.05]"
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
