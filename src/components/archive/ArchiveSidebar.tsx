"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { GAME_ROUTES } from "@/lib/game/constants";
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
  available: "○",
  in_progress: "◐",
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
      <aside className="w-full shrink-0 lg:w-40">
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/35">
          История
        </p>
        <p className="mt-1.5 text-xs text-white/30">Пока пусто</p>
      </aside>
    );
  }

  return (
    <aside className="w-full shrink-0 lg:w-40">
      <div className="mb-1 flex items-center justify-between gap-2 lg:mb-2 lg:block">
        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/40">
          История
        </p>
        <Link
          href={GAME_ROUTES.archive}
          className="text-[10px] text-[var(--accent)]/90 transition-colors hover:text-[var(--accent)] lg:mt-1.5 lg:inline-block lg:text-[11px]"
        >
          Все →
        </Link>
      </div>
      <ul className="flex gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] lg:flex-col lg:gap-1 lg:overflow-visible [&::-webkit-scrollbar]:hidden">
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
            "flex min-w-[4.75rem] items-center justify-between gap-1 rounded-md border px-2 py-1 text-left text-[10px] transition-all duration-200 lg:min-w-0 lg:rounded-[10px] lg:px-2.5 lg:py-1.5 lg:text-xs",
            isActive
              ? "border-[var(--accent)]/40 bg-[var(--accent)]/[0.1] text-white"
              : "border-white/[0.06] bg-white/[0.03] text-white/60 hover:border-white/[0.12] hover:bg-white/[0.05] hover:text-white/80 lg:border-transparent lg:bg-transparent",
            finished && !isActive && "opacity-55",
          );

          if (finished) {
            return (
              <li key={item.challengeId} className="shrink-0 lg:shrink">
                <div
                  className={className}
                  aria-current={isActive ? "true" : undefined}
                >
                  <span>{label}</span>
                  <span
                    className={cn(
                      "font-mono text-[10px] lg:text-xs",
                      status === "won"
                        ? "text-emerald-300/80"
                        : "text-rose-300/70",
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
                  className="font-mono text-[10px] text-white/35 lg:text-xs"
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
