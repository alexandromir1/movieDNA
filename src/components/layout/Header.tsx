"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

import { Logo, LogoMark } from "@/components/branding/Logo";
import {
  formatHeaderDate,
  formatHeaderDateShort,
} from "@/lib/game/format-date";
import { getUtcDateString } from "@/lib/game/daily";
import { GAME_ROUTES } from "@/lib/game/constants";
import { cn } from "@/lib/utils/cn";

function subscribe() {
  return () => undefined;
}

// Возвращаем строки (сравниваются по значению), иначе useSyncExternalStore
// зациклится на новом объекте при каждом снимке.
function getFullDate() {
  return formatHeaderDate(getUtcDateString());
}

function getShortDate() {
  return formatHeaderDateShort(getUtcDateString());
}

const NAV_ITEMS = [
  { href: GAME_ROUTES.today, label: "Игра" },
  { href: GAME_ROUTES.archive, label: "Архив" },
  { href: GAME_ROUTES.profile, label: "Профиль" },
] as const;

/**
 * Mobile: одна строка ~36px для Instagram WebView.
 * Desktop: прежняя полноценная шапка с лого, датой и навигацией.
 */
export function Header() {
  const fullDate = useSyncExternalStore(subscribe, getFullDate, getFullDate);
  const shortDate = useSyncExternalStore(subscribe, getShortDate, getShortDate);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#0e0e10]/95 backdrop-blur-md pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-9 max-w-6xl items-center justify-between gap-2 px-3 sm:h-11 sm:px-4 lg:hidden">
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

        <nav className="flex shrink-0 items-center gap-0.5" aria-label="Основное меню">
          <Link
            href={GAME_ROUTES.today}
            className={cn(
              "rounded-md px-2 py-1 text-[11px] font-medium transition-colors sm:text-xs",
              pathname === GAME_ROUTES.today || pathname.startsWith("/game/")
                ? "bg-white/[0.08] text-white"
                : "text-white/55 hover:bg-white/[0.05] hover:text-white/85",
            )}
          >
            Игра
          </Link>
          <Link
            href={GAME_ROUTES.archive}
            className={cn(
              "rounded-md px-2 py-1 text-[11px] font-medium transition-colors sm:text-xs",
              pathname === GAME_ROUTES.archive
                ? "bg-white/[0.08] text-white"
                : "text-white/55 hover:bg-white/[0.05] hover:text-white/85",
            )}
          >
            Архив
          </Link>
          <Link
            href={GAME_ROUTES.profile}
            className={cn(
              "rounded-md px-2 py-1 text-[11px] font-medium transition-colors sm:text-xs",
              pathname === GAME_ROUTES.profile
                ? "bg-white/[0.08] text-white"
                : "text-white/55 hover:bg-white/[0.05] hover:text-white/85",
            )}
          >
            Профиль
          </Link>
        </nav>
      </div>

      <div className="mx-auto hidden h-[72px] max-w-6xl items-center justify-between px-6 lg:flex">
        <Link
          href="/"
          className="rounded-[10px] transition-opacity hover:opacity-85"
        >
          <Logo dateLabel={fullDate} />
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === GAME_ROUTES.today &&
                pathname.startsWith("/game"));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-[10px] px-3.5 py-2 transition-colors duration-200",
                  isActive
                    ? "bg-white/[0.08] text-white"
                    : "text-white/45 hover:bg-white/[0.04] hover:text-white/80",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
