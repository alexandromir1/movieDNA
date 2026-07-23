"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { V2Atmosphere } from "@/components/v2/V2Atmosphere";
import { V2Button } from "@/components/v2/V2Button";
import { V2GlassCard } from "@/components/v2/V2GlassCard";
import { V2_ROUTES } from "@/lib/game/constants";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { readV2Result } from "@/lib/v2/result-handoff";
import { cn } from "@/lib/utils/cn";
import type { V2LevelResult } from "@/types/v2-content";

/** Результат дела — в том же visual language стенда. */
export function V2ResultView() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const [result, setResult] = useState<V2LevelResult | null | undefined>(
    undefined,
  );
  const [leaving, setLeaving] = useState(false);
  const navGuardRef = useRef(false);

  useEffect(() => {
    setResult(readV2Result());
  }, []);

  function goContinue() {
    if (navGuardRef.current) return;
    navGuardRef.current = true;
    setLeaving(true);
    window.setTimeout(() => {
      router.push(V2_ROUTES.game);
    }, 220);
  }

  if (result === undefined) {
    return (
      <div className="v2-shell relative min-h-[50dvh]">
        <V2Atmosphere intensity="soft" />
        <p className="relative z-10 px-4 py-16 text-center text-sm text-[var(--v2-ink-muted)]">
          …
        </p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="v2-shell relative min-h-[60dvh]">
        <V2Atmosphere intensity="soft" />
        <div className="v2-screen-enter relative z-10 mx-auto max-w-lg px-4 py-16">
          <V2GlassCard padding="lg" className="border-[var(--v2-border)]">
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--v2-ink)]">
              {t("v2.result.emptyTitle")}
            </h1>
            <p className="mt-3 text-sm text-[var(--v2-ink-muted)]">
              {t("v2.result.emptyBody")}
            </p>
            <div className="mt-8">
              <V2Button
                type="button"
                disabled={leaving}
                onClick={goContinue}
                className="w-full max-w-xs normal-case"
              >
                {t("v2.result.continueCta")}
              </V2Button>
            </div>
          </V2GlassCard>
        </div>
      </div>
    );
  }

  const title =
    locale === "en" ? result.movieTitle.en : result.movieTitle.ru;
  const lost = result.outcome === "lost";

  return (
    <div
      className={cn(
        "v2-shell relative min-h-[calc(100dvh-env(safe-area-inset-top,0px))]",
        "v2-screen-enter",
        leaving && "v2-screen-leave",
      )}
    >
      <V2Atmosphere intensity="rich" />

      <div className="relative z-10 mx-auto flex max-w-lg flex-col justify-center px-4 py-16">
        <V2GlassCard
          padding="lg"
          className="border-[var(--v2-border)] text-center"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--v2-ink-faint)]">
            {lost ? t("v2.result.lostLead") : t("v2.result.caseClosed")}
          </p>

          {!lost ? (
            <p className="mt-5 text-sm font-medium tracking-wide text-[var(--v2-accent)]">
              {t("v2.result.congrats")}
            </p>
          ) : (
            <p className="mt-5 text-sm font-medium tracking-wide text-[var(--v2-ink-muted)]">
              {t("v2.result.lostTitle")}
            </p>
          )}

          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--v2-ink)] sm:text-4xl">
            {title}
          </h1>

          {!lost ? (
            <p className="mt-4 text-base text-[var(--v2-ink-muted)]">
              {t("v2.result.wonTitle")}
            </p>
          ) : null}

          <p className="mt-3 text-sm text-[var(--v2-ink-faint)]">
            {t("v2.result.summary", {
              opened: result.openedSteps,
              total: result.totalSteps,
              attempts: result.attemptCount,
            })}
          </p>

          <div className="mt-10 flex flex-col items-center gap-3">
            <V2Button
              type="button"
              className="h-12 w-full max-w-xs normal-case tracking-[0.14em]"
              disabled={leaving}
              onClick={goContinue}
            >
              {t("v2.result.continueCta")}
            </V2Button>
            <Link
              href={V2_ROUTES.home}
              className={cn(
                "text-sm text-[var(--v2-ink-faint)] underline-offset-2 hover:text-[var(--v2-ink-muted)] hover:underline",
                leaving && "pointer-events-none opacity-40",
              )}
              onClick={(event) => {
                if (leaving) event.preventDefault();
              }}
            >
              {t("v2.result.backHome")}
            </Link>
          </div>
        </V2GlassCard>
      </div>
    </div>
  );
}
