"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

import { siteConfig } from "@/config/site";
import { formatHeaderDate } from "@/lib/game/format-date";
import { getUtcDateString } from "@/lib/game/daily";
import { GAME_ROUTES } from "@/lib/game/constants";

function subscribe() {
  return () => undefined;
}

function getClientDate() {
  return formatHeaderDate(getUtcDateString());
}

function getServerDate() {
  return formatHeaderDate(getUtcDateString());
}

export function Header() {
  const dateLabel = useSyncExternalStore(subscribe, getClientDate, getServerDate);

  return (
    <header className="border-b border-white/5 bg-[#111]">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 lg:px-6">
        <Link href="/" className="group flex flex-col leading-tight">
          <span className="text-xl font-bold tracking-[0.16em] text-white sm:text-2xl">
            {siteConfig.name}
          </span>
          <span className="mt-1 text-sm capitalize text-white/55 transition-colors group-hover:text-white/75">
            {dateLabel}
          </span>
        </Link>

        <nav className="flex items-center gap-5 text-xs uppercase tracking-widest text-white/40">
          <Link
            href={GAME_ROUTES.today}
            className="transition-colors hover:text-white/80"
          >
            Игра
          </Link>
          <Link
            href={GAME_ROUTES.archive}
            className="transition-colors hover:text-white/80"
          >
            Архив
          </Link>
          <Link
            href={GAME_ROUTES.stats}
            className="transition-colors hover:text-white/80"
          >
            Статистика
          </Link>
        </nav>
      </div>
    </header>
  );
}
