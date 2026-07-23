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
      <circle
        cx="10.5"
        cy="10.5"
        r="5.5"
        stroke="currentColor"
        strokeWidth="1.4"
      />
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
 * Первый экран v2 — один viewport без скролла (mobile first).
 * CTA всегда внизу видимой области.
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
    <div className="v2-shell relative flex h-full max-h-full flex-col overflow-hidden">
      <V2Atmosphere intensity="rich" />

      <div className="absolute right-3 top-[max(0.5rem,env(safe-area-inset-top))] z-20 sm:right-6 sm:top-5">
        <LanguageSwitcher className="scale-90 border-[var(--v2-border-muted)] bg-black/40 sm:scale-100" />
      </div>

      <div
        className={cn(
          "relative z-10 mx-auto flex h-full w-full max-w-4xl flex-col",
          "px-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]",
          "sm:px-8 sm:pb-6 sm:pt-6",
        )}
      >
        {/* Контент сжимается; кнопка всегда внизу */}
        <div className="v2-screen-enter flex min-h-0 flex-1 flex-col items-center overflow-hidden">
          <div className="flex w-full min-h-0 flex-1 flex-col items-center justify-center text-center">
            <V2BrandLink
              markSize={{ mobile: 36, desktop: 52 }}
              showWordmark={false}
            />
            <p className="mt-2 text-[13px] font-semibold tracking-[0.2em] sm:mt-3 sm:text-sm">
              <Link
                href={V2_ROUTES.home}
                className="rounded-sm outline-none transition-opacity hover:opacity-90 focus-visible:ring-1 focus-visible:ring-[var(--v2-focus)]"
                aria-label="MovieDNA — на главную"
              >
                <span className="text-[var(--v2-ink)]">Movie</span>
                <span className="text-[var(--v2-accent)]">DNA</span>
              </Link>
            </p>
            <p className="mt-0.5 hidden text-[9px] uppercase tracking-[0.28em] text-[var(--v2-ink-faint)] min-[390px]:block sm:mt-1">
              {t("v2.firstRun.deskTag")}
            </p>

            <h1 className="mt-3 max-w-xl text-[1.35rem] font-semibold leading-snug tracking-tight text-[var(--v2-ink)] sm:mt-6 sm:text-[2.15rem] sm:leading-tight">
              {t("v2.firstRun.headline")}
            </h1>
            <p className="mt-2 max-w-lg text-[12px] leading-snug text-[var(--v2-ink-muted)] line-clamp-3 sm:mt-3 sm:text-[15px] sm:leading-relaxed sm:line-clamp-none">
              {t("v2.firstRun.subhead")}
            </p>

            <div
              className={cn(
                "v2-howto mt-3 w-full max-w-3xl shrink text-left sm:mt-6",
                "rounded-[var(--v2-radius-lg)] border border-[var(--v2-border-muted)]",
                "bg-[rgb(20_16_12/0.72)] px-3 py-2.5 sm:px-5 sm:py-5",
              )}
            >
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-0 sm:py-1">
                {HOW_TO_ITEMS.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <li
                      key={item.titleKey}
                      className={cn(
                        "flex items-start gap-2 sm:gap-3 sm:px-4",
                        index > 0 &&
                          "border-t border-[var(--v2-border-muted)] pt-2 sm:border-l sm:border-t-0 sm:pt-0",
                      )}
                    >
                      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--v2-accent)] sm:h-8 sm:w-8" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--v2-accent)] sm:text-[12px] sm:tracking-[0.14em]">
                          {t(item.titleKey)}
                        </p>
                        <p className="mt-0.5 text-[11px] leading-snug text-[var(--v2-ink-muted)] line-clamp-2 sm:mt-1.5 sm:text-[13px] sm:line-clamp-none">
                          {t(item.bodyKey)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-xs shrink-0 flex-col items-center gap-2.5 pt-3 sm:gap-3 sm:pt-4">
          {entry?.cta === "continue" ? (
            <V2ProgressDots
              current={entry.displayLevel}
              total={getSequenceLength()}
              label={t("v2.game.caseProgress", {
                current: entry.displayLevel,
                total: getSequenceLength(),
              })}
            />
          ) : null}

          <Link href={V2_ROUTES.game} className="block w-full">
            <V2Button
              size="lg"
              className={cn(
                "h-11 w-full normal-case tracking-[0.14em] sm:h-12",
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
