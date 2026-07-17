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
      <aside className="w-full shrink-0 rounded-[12px] border border-white/[0.08] bg-white/[0.02] p-3 lg:w-40 lg:border-0 lg:bg-transparent lg:p-0">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/40">
          История Challenge
        </p>
        <p className="mt-3 text-xs text-white/30">Пока пусто</p>
      </aside>
    );
  }

  return (
    <aside className="w-full shrink-0 rounded-[12px] border border-white/[0.08] bg-white/[0.02] p-3 lg:w-40 lg:border-0 lg:bg-transparent lg:p-0">
      <div className="mb-3 flex items-end justify-between gap-2 lg:mb-2.5 lg:block">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/45">
            История Challenge
          </p>
          <p className="mt-1 text-[11px] text-white/30 lg:hidden">
            Ежедневные игры — листай дни
          </p>
        </div>
        <Link
          href={GAME_ROUTES.archive}
          className="shrink-0 text-[11px] text-[var(--accent)]/90 transition-colors hover:text-[var(--accent)] lg:mt-2 lg:inline-block"
        >
          Весь архив →
        </Link>
      </div>
      <ul className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden">
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
            "flex min-w-[7rem] items-center justify-between gap-2 rounded-[10px] border px-3 py-2 text-left text-xs transition-all duration-200 lg:min-w-0 lg:px-2.5 lg:py-1.5",
            isActive
              ? "border-[var(--accent)]/40 bg-[var(--accent)]/[0.1] text-white shadow-[0_0_0_1px_rgb(244_197_63/0.12)]"
              : "border-white/[0.08] bg-white/[0.03] text-white/65 hover:border-white/[0.14] hover:bg-white/[0.06] hover:text-white/85 lg:border-transparent lg:bg-transparent",
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
                      "font-mono text-xs",
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
