"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { V2Atmosphere } from "@/components/v2/V2Atmosphere";
import { V2BrandLink } from "@/components/v2/V2BrandLink";
import { V2Button } from "@/components/v2/V2Button";
import { V2ProgressDots } from "@/components/v2/V2ProgressDots";
import { V2_ROUTES } from "@/lib/game/constants";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { getHomeEntry, type HomeEntry } from "@/lib/v2/app";
import { getSequenceLength } from "@/lib/v2/level-sequence";
import { cn } from "@/lib/utils/cn";

const IDLE_HINT_MS = 10_000;

function IconDna({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M8 3c4 3.2 4 14.8 8 18"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M16 3c-4 3.2-4 14.8-8 18"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M9.2 7.5h5.6M8.4 12h7.2M9.2 16.5h5.6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconDetective({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="10.5" cy="10.5" r="5.5" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M14.8 14.8 19.5 19.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M8.2 10.5h4.6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconFilm({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect
        x="3.5"
        y="6"
        width="17"
        height="12"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M7 6V4.8M11 6V4.8M15 6V4.8M19 6V4.8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M3.5 10h17M3.5 14h17"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M7 10v4M11 10v4M15 10v4"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}

const HOW_TO_ITEMS = [
  {
    icon: IconDna,
    titleKey: "v2.firstRun.howDnaTitle" as const,
    bodyKey: "v2.firstRun.howDnaBody" as const,
  },
  {
    icon: IconDetective,
    titleKey: "v2.firstRun.howDetectiveTitle" as const,
    bodyKey: "v2.firstRun.howDetectiveBody" as const,
  },
  {
    icon: IconFilm,
    titleKey: "v2.firstRun.howUniqueTitle" as const,
    bodyKey: "v2.firstRun.howUniqueBody" as const,
  },
];

/**
 * Вход на стенд — forensic-атмосфера + краткие правила в три колонки.
 */
export function V2FirstRunView() {
  const { t } = useLocale();
  const [pulseCta, setPulseCta] = useState(false);
  const [entry, setEntry] = useState<HomeEntry | null>(null);

  useEffect(() => {
    setEntry(getHomeEntry());
    const timer = window.setTimeout(() => setPulseCta(true), IDLE_HINT_MS);
    return () => window.clearTimeout(timer);
  }, []);

  const ctaLabel =
    entry?.cta === "continue"
      ? t("v2.firstRun.continueCta")
      : t("v2.firstRun.startCta");

  return (
    <div className="v2-shell relative flex min-h-[calc(100dvh-env(safe-area-inset-top,0px))] flex-col">
      <V2Atmosphere intensity="rich" />

      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-5">
        <LanguageSwitcher className="border-[var(--v2-border-muted)] bg-black/40" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-5 pb-14 pt-20 sm:px-8">
        <div className="v2-screen-enter flex flex-col items-center text-center">
          <V2BrandLink markSize={52} showWordmark={false} />
          <p className="mt-4 text-sm font-semibold tracking-[0.2em]">
            <Link
              href={V2_ROUTES.home}
              className="rounded-sm outline-none transition-opacity hover:opacity-90 focus-visible:ring-1 focus-visible:ring-[var(--v2-focus)]"
              aria-label="MovieDNA — на главную"
            >
              <span className="text-[var(--v2-ink)]">Movie</span>
              <span className="text-[var(--v2-accent)]">DNA</span>
            </Link>
          </p>
          <p className="mt-1 text-[9px] uppercase tracking-[0.28em] text-[var(--v2-ink-faint)]">
            {t("v2.firstRun.deskTag")}
          </p>

          <h1 className="mt-9 max-w-xl text-[1.7rem] font-semibold tracking-tight text-[var(--v2-ink)] sm:text-[2.15rem] sm:leading-tight">
            {t("v2.firstRun.headline")}
          </h1>
          <p className="mt-3.5 max-w-lg text-sm leading-relaxed text-[var(--v2-ink-muted)] sm:text-[15px]">
            {t("v2.firstRun.subhead")}
          </p>

          <div
            className={cn(
              "v2-howto mt-8 w-full max-w-3xl text-left",
              "rounded-[var(--v2-radius-lg)] border border-[var(--v2-border-muted)]",
              "bg-[rgb(20_16_12/0.72)] px-4 py-5 sm:px-5 sm:py-6",
            )}
          >
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-0">
              {HOW_TO_ITEMS.map((item, index) => {
                const Icon = item.icon;
                return (
                  <li
                    key={item.titleKey}
                    className={cn(
                      "flex items-start gap-3 sm:px-4",
                      index > 0 &&
                        "border-t border-[var(--v2-border-muted)] pt-5 sm:border-l sm:border-t-0 sm:pt-0",
                    )}
                  >
                    <Icon className="mt-0.5 h-7 w-7 shrink-0 text-[var(--v2-accent)] sm:h-8 sm:w-8" />
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--v2-accent)] sm:text-[12px]">
                        {t(item.titleKey)}
                      </p>
                      <p className="mt-1.5 text-[12px] leading-snug text-[var(--v2-ink-muted)] sm:text-[13px]">
                        {t(item.bodyKey)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {entry?.cta === "continue" ? (
            <div className="mt-6 w-full max-w-xs">
              <V2ProgressDots
                current={entry.displayLevel}
                total={getSequenceLength()}
                label={t("v2.game.caseProgress", {
                  current: entry.displayLevel,
                  total: getSequenceLength(),
                })}
              />
            </div>
          ) : null}

          <Link href={V2_ROUTES.game} className="mt-9 block w-full max-w-xs">
            <V2Button
              size="lg"
              className={cn(
                "h-12 w-full normal-case tracking-[0.14em]",
                pulseCta && "v2-first-run-cta-pulse",
              )}
            >
              {ctaLabel}
            </V2Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
