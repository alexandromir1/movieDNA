"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { Logo, LogoMark } from "@/components/branding/Logo";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import {
  formatHeaderDate,
  formatHeaderDateShort,
} from "@/lib/game/format-date";
import { getUtcDateString } from "@/lib/game/daily";
import { GAME_ROUTES } from "@/lib/game/constants";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { readV2Return } from "@/lib/v2/case-analytics";
import { cn } from "@/lib/utils/cn";

/**
 * Mobile: лого + дата + бургер (пункты в выпадающем меню).
 * Desktop: полноценная шапка с лого, датой и навигацией.
 */
export function Header() {
  const { locale, t } = useLocale();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [v2ReturnActive, setV2ReturnActive] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
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
    { href: GAME_ROUTES.about, label: t("nav.about") },
  ] as const;

  const isV2 = pathname === "/v2" || pathname.startsWith("/v2/");

  useEffect(() => {
    setMenuOpen(false);
    setV2ReturnActive(readV2Return() != null);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    function onPointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [menuOpen]);

  /** v2: без даты, архива и v1-навигации (docs/v2-first-run.md). */
  if (isV2) {
    return null;
  }

  const brandMark = (
    <>
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
    </>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#0e0e10]/95 backdrop-blur-md pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-9 max-w-6xl items-center justify-between gap-2 px-3 sm:h-11 sm:px-4 lg:hidden">
        {v2ReturnActive ? (
          <span className="flex min-w-0 items-center gap-1.5" aria-label="MovieDNA">
            {brandMark}
          </span>
        ) : (
          <Link
            href="/"
            className="flex min-w-0 items-center gap-1.5 rounded-md transition-opacity hover:opacity-85"
          >
            {brandMark}
          </Link>
        )}

        <div ref={menuRef} className="relative flex shrink-0 items-center gap-1.5">
          {pathname !== "/" && <LanguageSwitcher />}
          {!v2ReturnActive ? (
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-menu"
            aria-label={menuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <span className="sr-only">
              {menuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
            </span>
            <span className="flex w-4 flex-col gap-[3px]" aria-hidden>
              <span
                className={cn(
                  "h-px w-full bg-current transition-transform duration-200",
                  menuOpen && "translate-y-[4px] rotate-45",
                )}
              />
              <span
                className={cn(
                  "h-px w-full bg-current transition-opacity duration-200",
                  menuOpen && "opacity-0",
                )}
              />
              <span
                className={cn(
                  "h-px w-full bg-current transition-transform duration-200",
                  menuOpen && "-translate-y-[4px] -rotate-45",
                )}
              />
            </span>
          </button>
          ) : null}

          {menuOpen && !v2ReturnActive && (
            <nav
              id="mobile-nav-menu"
              aria-label={t("nav.menu")}
              className="absolute right-0 top-[calc(100%+0.4rem)] z-40 min-w-[10.5rem] overflow-hidden rounded-[12px] border border-white/[0.1] bg-[#141416]/98 py-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-md"
            >
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href === GAME_ROUTES.today &&
                    pathname.startsWith("/game/"));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "block px-3.5 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-white/[0.08] text-white"
                        : "text-white/65 hover:bg-white/[0.05] hover:text-white",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
      </div>

      <div className="mx-auto hidden h-[72px] max-w-6xl items-center justify-between px-6 lg:flex">
        {v2ReturnActive ? (
          <span className="rounded-[10px]" aria-label="MovieDNA">
            <Logo dateLabel={fullDate} />
          </span>
        ) : (
          <Link
            href="/"
            className="rounded-[10px] transition-opacity hover:opacity-85"
          >
            <Logo dateLabel={fullDate} />
          </Link>
        )}

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          {!v2ReturnActive ? (
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
          ) : null}
        </div>
      </div>
    </header>
  );
}
