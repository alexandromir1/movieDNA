"use client";

import Link from "next/link";
import { useEffect, useId, useRef, type CSSProperties } from "react";

import { V2Button } from "@/components/v2/V2Button";
import { V2GlassCard } from "@/components/v2/V2GlassCard";
import { V2_ROUTES } from "@/lib/game/constants";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { cn } from "@/lib/utils/cn";
import type { V2LevelResult } from "@/types/v2-content";

/** Тёплые «салют»-частицы — детерминированно, без Math.random в render. */
const CONFETTI = Array.from({ length: 36 }, (_, index) => ({
  left: (index * 29 + 7) % 100,
  delay: ((index * 11) % 14) / 10,
  duration: 2.4 + ((index * 5) % 16) / 10,
  color:
    index % 5 === 0
      ? "#c9a96e"
      : index % 5 === 1
        ? "#ebe4d8"
        : index % 5 === 2
          ? "#d4b87a"
          : index % 5 === 3
            ? "#8f7750"
            : "#f0e6d0",
  rotate: (index * 47) % 360,
  width: 5 + (index % 4),
  height: 8 + (index % 5),
}));

const BURSTS = Array.from({ length: 12 }, (_, index) => ({
  angle: index * 30,
  delay: 0.05 + (index % 4) * 0.04,
  distance: 42 + (index % 3) * 18,
  color: index % 2 === 0 ? "#c9a96e" : "#ebe4d8",
}));

function WinCelebration() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
      aria-hidden
    >
      <div className="v2-result-burst absolute left-1/2 top-[38%] h-0 w-0">
        {BURSTS.map((burst, index) => (
          <span
            key={index}
            className="v2-result-spark"
            style={
              {
                "--spark-angle": `${burst.angle}deg`,
                "--spark-delay": `${burst.delay}s`,
                "--spark-distance": `${burst.distance}px`,
                backgroundColor: burst.color,
              } as CSSProperties
            }
          />
        ))}
      </div>
      {CONFETTI.map((piece, index) => (
        <span
          key={index}
          className="confetti-piece"
          style={
            {
              left: `${piece.left}%`,
              width: piece.width,
              height: piece.height,
              backgroundColor: piece.color,
              transform: `rotate(${piece.rotate}deg)`,
              "--confetti-delay": `${piece.delay}s`,
              "--confetti-duration": `${piece.duration}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

export interface V2ResultModalProps {
  result: V2LevelResult;
  onContinue: () => void;
  continuing?: boolean;
}

/** Модалка результата дела поверх игрового экрана. */
export function V2ResultModal({
  result,
  onContinue,
  continuing = false,
}: V2ResultModalProps) {
  const { t, locale } = useLocale();
  const titleId = useId();
  const continueRef = useRef<HTMLButtonElement>(null);
  const lost = result.outcome === "lost";
  const title = locale === "en" ? result.movieTitle.en : result.movieTitle.ru;

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    continueRef.current?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
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

      {!lost ? <WinCelebration /> : null}

      <div className="v2-result-modal-panel relative z-10 w-full max-w-md">
        <V2GlassCard
          padding="lg"
          className="border-[var(--v2-border)] text-center shadow-[0_24px_80px_rgb(0_0_0/0.55)]"
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

          <h2
            id={titleId}
            className="mt-3 text-3xl font-semibold tracking-tight text-[var(--v2-ink)] sm:text-4xl"
          >
            {title}
          </h2>

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
              ref={continueRef}
              type="button"
              className="h-12 w-full max-w-xs normal-case tracking-[0.14em]"
              disabled={continuing}
              onClick={onContinue}
            >
              {t("v2.result.continueCta")}
            </V2Button>
            <Link
              href={V2_ROUTES.home}
              className={cn(
                "text-sm text-[var(--v2-ink-faint)] underline-offset-2 hover:text-[var(--v2-ink-muted)] hover:underline",
                continuing && "pointer-events-none opacity-40",
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
