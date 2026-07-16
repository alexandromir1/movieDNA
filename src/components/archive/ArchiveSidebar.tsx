"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { formatSidebarDateLabel } from "@/lib/game/format-date";
import { getUtcDateString } from "@/lib/game/daily";
import {
  resolveChallengePlayStatus,
  type ChallengePlayStatus,
} from "@/lib/game/play-status";
import { cn } from "@/lib/utils/cn";

export interface ChallengeNavItem {
  date: string;
  challengeId: string;
  isToday: boolean;
}

interface ArchiveSidebarProps {
  items: ChallengeNavItem[];
  /** Дата текущего открытого Challenge (YYYY-MM-DD) */
  activeDate?: string;
}

const STATUS_MARK: Record<ChallengePlayStatus, string> = {
  won: "✓",
  lost: "✕",
  available: "•",
  in_progress: "◦",
};

function hrefForItem(item: ChallengeNavItem): string {
  return item.isToday ? "/game" : `/game/${item.date}`;
}

export function ArchiveSidebar({ items, activeDate }: ArchiveSidebarProps) {
  const pathname = usePathname();
  const today = getUtcDateString();
  const [statuses, setStatuses] = useState<Record<string, ChallengePlayStatus>>(
    {},
  );

  useEffect(() => {
    const refresh = () => {
      const next: Record<string, ChallengePlayStatus> = {};
      for (const item of items) {
        next[item.challengeId] = resolveChallengePlayStatus(item);
      }
      setStatuses(next);
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
    return (
      <aside className="w-full shrink-0 lg:w-44">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">
          Архив
        </p>
        <p className="mt-3 text-xs text-white/30">Пока пусто</p>
      </aside>
    );
  }

  return (
    <aside className="w-full shrink-0 lg:w-44">
      <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-white/30">
        Challenge
      </p>
      <ul className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-0 lg:overflow-visible lg:pb-0">
        {items.map((item) => {
          const status = statuses[item.challengeId] ?? "available";
          const finished = status === "won" || status === "lost";
          const isActive =
            activeDate === item.date ||
            (item.isToday && pathname === "/game") ||
            pathname === `/game/${item.date}`;
          const label = formatSidebarDateLabel(item.date, today);
          const mark = STATUS_MARK[status];

          const className = cn(
            "flex min-w-[7.5rem] items-center justify-between gap-3 border px-3 py-2 text-left text-sm transition-colors lg:min-w-0 lg:border-0 lg:border-l-2 lg:px-3 lg:py-2",
            isActive
              ? "border-white/30 bg-white/10 text-white lg:border-l-white"
              : "border-white/10 text-white/55 hover:border-white/20 hover:bg-white/5 hover:text-white/80 lg:border-l-transparent",
            finished && !isActive && "opacity-45",
          );

          if (finished) {
            return (
              <li key={item.challengeId} className="shrink-0 lg:shrink">
                <div className={className} aria-current={isActive ? "true" : undefined}>
                  <span>{label}</span>
                  <span
                    className={cn(
                      "font-mono text-xs",
                      status === "won" ? "text-emerald-300/80" : "text-rose-300/70",
                    )}
                    aria-label={status === "won" ? "пройден" : "проигран"}
                  >
                    {mark}
                  </span>
                </div>
              </li>
            );
          }

          return (
            <li key={item.challengeId} className="shrink-0 lg:shrink">
              <Link
                href={hrefForItem(item)}
                className={className}
                aria-current={isActive ? "page" : undefined}
              >
                <span>{label}</span>
                <span
                  className="font-mono text-xs text-white/35"
                  aria-label={
                    status === "in_progress" ? "в процессе" : "не проходил"
                  }
                >
                  {mark}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
