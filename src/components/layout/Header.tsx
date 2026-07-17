"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

import { Logo } from "@/components/branding/Logo";
import {
  formatHeaderDate,
  formatHeaderDateShort,
} from "@/lib/game/format-date";
import { getUtcDateString } from "@/lib/game/daily";
import { GAME_ROUTES } from "@/lib/game/constants";

function subscribe() {
  return () => undefined;
}

function getDateLabels() {
  const today = getUtcDateString();
  return {
    full: formatHeaderDate(today),
    short: formatHeaderDateShort(today),
  };
}

/** Компактная шапка: лого + дата + Архив. Без тяжёлого навбара. */
export function Header() {
  const dates = useSyncExternalStore(subscribe, getDateLabels, getDateLabels);

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#0e0e10]/92 backdrop-blur-md pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-3 px-3 sm:h-14 sm:px-4 lg:px-6">
        <Link
          href="/"
          className="min-w-0 rounded-[8px] transition-opacity hover:opacity-85"
        >
          <Logo dateLabel={dates.full} dateLabelShort={dates.short} compact />
        </Link>

        <Link
          href={GAME_ROUTES.archive}
          className="shrink-0 rounded-[8px] px-2.5 py-1.5 text-xs font-medium text-white/55 transition-colors duration-200 hover:bg-white/[0.05] hover:text-white/85 sm:text-sm"
        >
          Архив
        </Link>
      </div>
    </header>
  );
}
