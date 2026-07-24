"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { V2Button } from "@/components/v2/V2Button";
import { V2GlassCard } from "@/components/v2/V2GlassCard";
import { V2_ROUTES } from "@/lib/game/constants";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { cn } from "@/lib/utils/cn";
import type { V2LevelResult } from "@/types/v2-content";

export interface V2ResultModalProps {
  result: V2LevelResult;
  /** Кадр улики для поэтапного появления (presentation). */
  evidenceSrc?: string;
  evidenceWidth?: number;
  evidenceHeight?: number;
  /** Существующий киномарафон — как «похожие дела». */
  relatedHref?: string | null;
  onContinue: () => void;
  continuing?: boolean;
}

/** Модалка результата дела поверх игрового экрана. */
export function V2ResultModal({
  result,
  evidenceSrc,
  evidenceWidth = 16,
  evidenceHeight = 9,
  relatedHref = null,
  onContinue,
  continuing = false,
}: V2ResultModalProps) {
  const { t, locale } = useLocale();
  const titleId = useId();
  const continueRef = useRef<HTMLButtonElement>(null);
  const lost = result.outcome === "lost";
  const title = locale === "en" ? result.movieTitle.en : result.movieTitle.ru;
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
      }
    }
    window.addEventListener("keydown", onKey);

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      setStage(3);
      continueRef.current?.focus();
      return () => {
        document.body.style.overflow = previous;
        window.removeEventListener("keydown", onKey);
      };
    }

    // фото → заголовок → CTA
    const t1 = window.setTimeout(() => setStage(1), 80);
    const t2 = window.setTimeout(() => setStage(2), 320);
    const t3 = window.setTimeout(() => {
      setStage(3);
      continueRef.current?.focus();
    }, 560);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, []);

  return (
    <div
      className="v2-result-modal-root absolute inset-0 z-50 flex items-center justify-center px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="v2-result-modal-backdrop absolute inset-0" aria-hidden />

      <div className="v2-result-modal-panel relative z-10 w-full max-w-md">
        <V2GlassCard
          padding="lg"
          className="border-[var(--v2-border)] text-center shadow-[0_24px_80px_rgb(0_0_0/0.55)]"
        >
          {evidenceSrc ? (
            <div
              className={cn(
                "v2-result-evidence mx-auto overflow-hidden",
                stage >= 1 ? "v2-result-stage-in" : "opacity-0",
              )}
              style={{ aspectRatio: `${evidenceWidth} / ${evidenceHeight}` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- archival still, not LCP hero */}
              <img
                src={evidenceSrc}
                alt=""
                className="h-full w-full object-cover"
                draggable={false}
              />
            </div>
          ) : null}

          <div
            className={cn(
              stage >= 2 ? "v2-result-stage-in" : "opacity-0",
              evidenceSrc ? "mt-5" : undefined,
            )}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--v2-ink-faint)]">
              {lost ? t("v2.result.lostLead") : t("v2.result.caseClosed")}
            </p>

            {!lost ? (
              <p className="mt-4 text-sm font-medium tracking-wide text-[var(--v2-accent)]">
                {t("v2.result.congrats")}
              </p>
            ) : (
              <p className="mt-4 text-sm font-medium tracking-wide text-[var(--v2-ink-muted)]">
                {t("v2.result.lostTitle")}
              </p>
            )}

            <h2
              id={titleId}
              className="mt-3 text-3xl font-semibold tracking-tight text-[var(--v2-ink)] sm:text-4xl"
            >
              {title}
            </h2>

            {!lost ? (
              <p className="mt-3 text-base text-[var(--v2-ink-muted)]">
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
          </div>

          <div
            className={cn(
              "mt-10 flex flex-col items-center gap-3",
              stage >= 3 ? "v2-result-stage-in" : "opacity-0",
            )}
          >
            <V2Button
              ref={continueRef}
              type="button"
              className="h-12 w-full max-w-xs normal-case tracking-[0.14em]"
              disabled={continuing || stage < 3}
              onClick={onContinue}
            >
              {t("v2.result.continueCta")}
            </V2Button>
            {relatedHref ? (
              <Link
                href={relatedHref}
                className={cn(
                  "v2-related-cases-link text-sm tracking-[0.06em] text-[var(--v2-accent)] underline-offset-2 hover:underline",
                  (continuing || stage < 3) && "pointer-events-none opacity-40",
                )}
              >
                {t("v2.result.relatedCases")}
              </Link>
            ) : null}
            <Link
              href={V2_ROUTES.home}
              className={cn(
                "text-sm text-[var(--v2-ink-faint)] underline-offset-2 hover:text-[var(--v2-ink-muted)] hover:underline",
                (continuing || stage < 3) && "pointer-events-none opacity-40",
              )}
            >
              {t("v2.result.backHome")}
            </Link>
          </div>
        </V2GlassCard>
      </div>
    </div>
  );
}
