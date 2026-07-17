"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

import { LogoMark } from "@/components/branding/Logo";
import { formatHeaderDateShort } from "@/lib/game/format-date";
import { getUtcDateString } from "@/lib/game/daily";
import { GAME_ROUTES } from "@/lib/game/constants";

function subscribe() {
  return () => undefined;
}

function getShortDate() {
  return formatHeaderDateShort(getUtcDateString());
}

/**
 * Мобильный приоритет: одна строка ~36px.
 * Лого + дата inline, справа только Архив.
 */
export function Header() {
  const shortDate = useSyncExternalStore(subscribe, getShortDate, getShortDate);

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#0e0e10]/95 backdrop-blur-md pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-9 max-w-6xl items-center justify-between gap-2 px-3 sm:h-11 sm:px-4 lg:px-6">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-1.5 rounded-md transition-opacity hover:opacity-85"
        >
          <LogoMark size={20} className="sm:hidden" />
          <LogoMark size={24} className="hidden sm:block" />
          <span className="truncate text-[13px] font-bold tracking-[0.1em] text-white sm:text-sm">
            MovieDNA
          </span>
          <span className="text-white/25" aria-hidden>
            ·
          </span>
          <span className="truncate text-[11px] capitalize text-white/45 sm:text-xs">
            {shortDate}
          </span>
        </Link>

        <Link
          href={GAME_ROUTES.archive}
          className="shrink-0 rounded-md px-2 py-1 text-[11px] font-medium text-white/55 transition-colors hover:bg-white/[0.05] hover:text-white/85 sm:text-xs"
        >
          Архив
        </Link>
      </div>
    </header>
  );
}
