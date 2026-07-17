"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  loadPlayerStats,
  type CompletedChallengeRecord,
} from "@/lib/game/player-stats";
import {
  resolveChallengePlayStatus,
  type ChallengePlayStatus,
} from "@/lib/game/play-status";
import { cn } from "@/lib/utils/cn";

export interface ArchiveListItem {
  date: string;
  challengeId: string;
  title: string;
  titleOriginal: string | null;
  year: number;
  image: string;
}

interface PlayerArchiveListProps {
  items: ArchiveListItem[];
}

const STATUS_LABEL: Record<ChallengePlayStatus, string> = {
  available: "Играть",
  in_progress: "Продолжить",
  won: "Победа",
  lost: "Поражение",
};

function formatArchiveDate(date: string): string {
  const parsed = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

export function PlayerArchiveList({ items }: PlayerArchiveListProps) {
  const [statuses, setStatuses] = useState<Record<string, ChallengePlayStatus>>(
    {},
  );
  const [records, setRecords] = useState<
    Record<string, CompletedChallengeRecord>
  >({});

  useEffect(() => {
    const refresh = () => {
      const updated: Record<string, ChallengePlayStatus> = {};
      const nextRecords: Record<string, CompletedChallengeRecord> = {};
      const stats = loadPlayerStats();

      for (const item of items) {
        updated[item.challengeId] = resolveChallengePlayStatus(item);
      }
      for (const record of stats.completedChallenges) {
        nextRecords[record.challengeId] = record;
      }

      setStatuses(updated);
      setRecords(nextRecords);
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
        const record = records[item.challengeId];

        if (finished) {
          return (
            <li key={item.challengeId}>
              <div className="flex gap-3 px-3 py-3 sm:gap-4 sm:px-4">
                <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-[8px] border border-white/[0.08] bg-black sm:h-[4.5rem] sm:w-14">
                  <Image
                    src={item.image}
                    alt=""
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <p className="truncate text-sm font-medium text-white">
                      {item.title}
                    </p>
                    <span className="text-xs text-white/35">{item.year}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-white/40">
                    {formatArchiveDate(item.date)}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span
                      className={cn(
                        "rounded-md px-1.5 py-0.5 font-medium",
                        status === "won"
                          ? "bg-emerald-400/10 text-emerald-300/90"
                          : "bg-rose-400/10 text-rose-300/85",
                      )}
                    >
                      {STATUS_LABEL[status]}
                    </span>
                    {record && status === "won" && (
                      <span className="tabular-nums text-white/50">
                        Movie Score{" "}
                        <span className="font-medium text-white/75">
                          {record.movieScore}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        }

        return (
          <li key={item.challengeId}>
            <Link
              href={`/game/${item.date}`}
              className="flex items-center justify-between gap-3 px-4 py-3.5 text-sm transition-colors duration-200 hover:bg-white/[0.05]"
            >
              <div>
                <p className="font-mono text-sm text-white/80">{item.date}</p>
                <p className="mt-0.5 text-xs text-white/35">
                  Challenge ещё не пройден
                </p>
              </div>
              <span className="text-xs text-white/35">
                {STATUS_LABEL[status]} →
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
