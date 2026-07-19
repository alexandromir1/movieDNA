"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

import { Logo, LogoMark } from "@/components/branding/Logo";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import {
  formatHeaderDate,
  formatHeaderDateShort,
} from "@/lib/game/format-date";
import { getUtcDateString } from "@/lib/game/daily";
import { GAME_ROUTES } from "@/lib/game/constants";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { cn } from "@/lib/utils/cn";

/**
 * Mobile: одна строка ~36px для Instagram WebView.
 * Desktop: прежняя полноценная шапка с лого, датой и навигацией.
 */
export function Header() {
  const { locale, t } = useLocale();
  const pathname = usePathname();
  const today = getUtcDateString();
  const fullDate = useMemo(
    () => formatHeaderDate(today, locale),
    [today, locale],
  );
  const shortDate = useMemo(
    () => formatHeaderDateShort(today, locale),
    [today, locale],
  );

  const navItems = [
    { href: GAME_ROUTES.today, label: t("nav.play") },
    { href: GAME_ROUTES.archive, label: t("nav.archive") },
    { href: GAME_ROUTES.profile, label: t("nav.profile") },
  ] as const;

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
            {t("brand.name")}
          </span>
          <span className="text-white/25" aria-hidden>
            ·
          </span>
          <span className="truncate text-[11px] capitalize text-white/45 sm:text-xs">
            {shortDate}
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-1.5">
          <LanguageSwitcher />
          <nav className="flex items-center gap-0.5" aria-label={t("nav.menu")}>
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href === GAME_ROUTES.today &&
                  pathname.startsWith("/game/"));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-md px-2 py-1 text-[11px] font-medium transition-colors sm:text-xs",
                    isActive
                      ? "bg-white/[0.08] text-white"
                      : "text-white/55 hover:bg-white/[0.05] hover:text-white/85",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="mx-auto hidden h-[72px] max-w-6xl items-center justify-between px-6 lg:flex">
        <Link
          href="/"
          className="rounded-[10px] transition-opacity hover:opacity-85"
        >
          <Logo dateLabel={fullDate} />
        </Link>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <nav className="flex items-center gap-1 text-sm" aria-label={t("nav.menu")}>
            {navItems.map((item) => {
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
      </div>
    </header>
  );
}
