"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

import { Logo } from "@/components/branding/Logo";
import { formatHeaderDate } from "@/lib/game/format-date";
import { getUtcDateString } from "@/lib/game/daily";
import { GAME_ROUTES } from "@/lib/game/constants";
import { cn } from "@/lib/utils/cn";

function subscribe() {
  return () => undefined;
}

function getDateLabel() {
  return formatHeaderDate(getUtcDateString());
}

const NAV_ITEMS = [
  { href: GAME_ROUTES.today, label: "Игра" },
  { href: GAME_ROUTES.archive, label: "Архив" },
  { href: GAME_ROUTES.stats, label: "Статистика" },
] as const;

export function Header() {
  const dateLabel = useSyncExternalStore(subscribe, getDateLabel, getDateLabel);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#0e0e10]/90 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-4 lg:px-6">
        <Link
          href="/"
          className="rounded-[10px] transition-opacity hover:opacity-85"
        >
          <Logo dateLabel={dateLabel} />
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
