"use client";

import Link from "next/link";

import { ComeBackTomorrow } from "@/components/game/ComeBackTomorrow";
import { Button } from "@/components/ui/Button";
import { REVEAL_REGION_COUNT } from "@/config/economy";
import { GAME_ROUTES } from "@/lib/game/constants";
import { cn } from "@/lib/utils/cn";

import type { Movie } from "@/types/content";
import type { MovieScoreBreakdown } from "@/engine/score";

export function formatElapsedClock(seconds: number): string {
  const mins = Math.floor(Math.max(0, seconds) / 60);
  const secs = Math.max(0, seconds) % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function winHeadline(openedRegionCount: number): string {
  if (openedRegionCount <= 1) return "Да! С первого взгляда";
  if (openedRegionCount <= 2) return "Да! Я справился";
  if (openedRegionCount <= 3) return "Сильная игра";
  return "Справился!";
}

/** Детерминированные конфетти: без Math.random в render */
const CONFETTI_PIECES = Array.from({ length: 28 }, (_, index) => ({
  left: (index * 37 + 11) % 100,
  delay: ((index * 13) % 10) / 10,
  duration: 2.2 + ((index * 7) % 12) / 10,
  color:
    index % 4 === 0
      ? "#F4C53F"
      : index % 4 === 1
        ? "#ffffff"
        : index % 4 === 2
          ? "#6ee7b7"
          : "#f4c53f99",
  rotate: (index * 53) % 360,
}));

function ConfettiOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-10 h-full overflow-hidden"
      aria-hidden="true"
    >
      {CONFETTI_PIECES.map((piece, index) => (
        <span
          key={index}
          className="confetti-piece"
          style={
            {
              left: `${piece.left}%`,
              backgroundColor: piece.color,
              transform: `rotate(${piece.rotate}deg)`,
              "--confetti-delay": `${piece.delay}s`,
              "--confetti-duration": `${piece.duration}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

interface ChallengeResultCardProps {
  movie: Movie;
  won: boolean;
  isDaily: boolean;
  scoreBreakdown: MovieScoreBreakdown | null;
  openedRegionCount: number;
  yesterdayHref: string | null;
  imageExpanded: boolean;
  onExpandImage: () => void;
  onShare: () => void;
  shareFeedback: string | null;
  shareFallbackText?: string | null;
}

/**
 * Кульминация Challenge: награда / «завтра лучше» + понятный next step.
 * Score не пересчитывает — только показывает Engine breakdown.
 */
export function ChallengeResultCard({
  movie,
  won,
  isDaily,
  scoreBreakdown,
  openedRegionCount,
  yesterdayHref,
  imageExpanded,
  onExpandImage,
  onShare,
  shareFeedback,
  shareFallbackText = null,
}: ChallengeResultCardProps) {
  const timeLabel = scoreBreakdown
    ? formatElapsedClock(scoreBreakdown.elapsedSeconds)
    : null;

  return (
    <div
      className={cn(
        "relative w-full max-w-md text-center",
        won ? "result-win" : "result-lose",
      )}
    >
      {won && <ConfettiOverlay />}

      {/* 1. How well did I play? */}
      {won && scoreBreakdown ? (
        <div className="relative z-[1]">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
            {winHeadline(scoreBreakdown.openedRegionCount)}
          </p>

          <p className="mt-5 text-[10px] font-medium uppercase tracking-[0.35em] text-white/40">
            Movie Score
          </p>
          <p className="mt-1 text-6xl font-bold tabular-nums tracking-tight text-white sm:text-7xl">
            {scoreBreakdown.total}
          </p>

          {/* Percentile slot — reserved, no fake data */}
          <div className="mx-auto mt-4 flex max-w-xs items-center justify-center rounded-full border border-dashed border-white/15 px-4 py-2">
            <p className="text-[11px] tracking-wide text-white/30">
              Лучше, чем —% игроков · скоро
            </p>
          </div>
        </div>
      ) : (
        <div className="relative z-[1]">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rose-300/90">
            Чёрт. Завтра попробую лучше
          </p>
          <p className="mt-4 text-[11px] uppercase tracking-[0.25em] text-white/35">
            Правильный ответ
          </p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {movie.title}
          </h2>
          {movie.titleOriginal && (
            <p className="mt-1.5 text-sm text-white/50">{movie.titleOriginal}</p>
          )}
          <p className="mt-0.5 text-xs text-white/35">{movie.year}</p>
        </div>
      )}

      {/* 2. Why this score? */}
      {won && scoreBreakdown && (
        <ul className="relative z-[1] mt-6 space-y-2 rounded-[14px] border border-white/[0.08] bg-black/30 px-4 py-3.5 text-left text-sm">
          <BreakdownRow
            label="Регионы"
            value={`${scoreBreakdown.openedRegionCount}/${REVEAL_REGION_COUNT}`}
          />
          <BreakdownRow label="Время" value={timeLabel ?? "—"} />
          <BreakdownRow
            label="Очки за регионы"
            value={String(scoreBreakdown.revealScore)}
          />
          {scoreBreakdown.timeBonus > 0 && (
            <BreakdownRow
              label="Бонус времени"
              value={`+${scoreBreakdown.timeBonus}`}
            />
          )}
          {scoreBreakdown.guessBonus > 0 && (
            <BreakdownRow
              label={
                scoreBreakdown.wrongGuessCount === 0
                  ? "С первой попытки"
                  : "Бонус за попытки"
              }
              value={`+${scoreBreakdown.guessBonus}`}
            />
          )}
          {scoreBreakdown.firstPlayBonus > 0 && (
            <BreakdownRow
              label="Первый запуск"
              value={`+${scoreBreakdown.firstPlayBonus}`}
            />
          )}
        </ul>
      )}

      {!won && (
        <p className="relative z-[1] mt-4 text-xs text-white/40">
          Открыто регионов: {openedRegionCount}/{REVEAL_REGION_COUNT}
        </p>
      )}

      {/* 4. Share as achievement card (wins) */}
      {won && scoreBreakdown && (
        <div className="relative z-[1] mt-5 overflow-hidden rounded-[16px] border border-[var(--accent)]/40 bg-gradient-to-b from-[var(--accent)]/[0.14] to-black/40 px-4 py-5 text-left shadow-[0_0_48px_rgb(244_197_63_/_0.1)]">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[var(--accent)]">
              MovieDNA
            </p>
            <p className="font-mono text-sm tracking-widest text-white/55" aria-hidden>
              {Array.from({ length: REVEAL_REGION_COUNT }, (_, index) =>
                index < scoreBreakdown.openedRegionCount ? "▮" : "▯",
              ).join("")}
            </p>
          </div>

          <div className="mt-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-white/40">
                Movie Score
              </p>
              <p className="mt-0.5 text-4xl font-bold tabular-nums text-white">
                {scoreBreakdown.total}
              </p>
            </div>
            <div className="pb-1 text-right text-xs leading-relaxed text-white/50">
              <p>
                {scoreBreakdown.openedRegionCount}/{REVEAL_REGION_COUNT} reveal
              </p>
              <p>{timeLabel}</p>
            </div>
          </div>

          <p className="mt-4 border-t border-white/[0.1] pt-3 text-base font-semibold text-white">
            {movie.title}
            {movie.year > 0 ? (
              <span className="ml-1.5 font-normal text-white/40">
                {movie.year}
              </span>
            ) : null}
          </p>

          <Button
            variant="secondary"
            size="lg"
            className="mt-4 w-full border-[var(--accent)]/50 bg-[var(--accent)] text-sm font-semibold text-black hover:brightness-105"
            onClick={onShare}
          >
            Поделиться достижением
          </Button>
          {shareFeedback && (
            <p className="mt-2 text-center text-xs text-white/40">
              {shareFeedback}
            </p>
          )}
          {shareFallbackText && (
            <pre className="mt-3 max-h-36 overflow-auto whitespace-pre-wrap rounded-[10px] border border-white/10 bg-black/50 px-3 py-2 text-left text-[11px] leading-relaxed text-white/70 select-all">
              {shareFallbackText}
            </pre>
          )}
        </div>
      )}

      {/* 3. What's next — prioritized, not overloaded */}
      <div className="relative z-[1] mt-6 flex w-full flex-col gap-2.5">
        {!won && !imageExpanded && (
          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={onExpandImage}
          >
            Посмотреть изображение полностью
          </Button>
        )}

        {yesterdayHref && (
          <Link
            href={yesterdayHref}
            className="inline-flex h-12 w-full items-center justify-center rounded-[10px] bg-[var(--accent)] text-sm font-medium text-black transition-all duration-200 hover:brightness-105 active:scale-[0.98]"
          >
            Пройти вчерашний Challenge
          </Link>
        )}

        <Link
          href={GAME_ROUTES.archive}
          className={cn(
            "inline-flex h-12 w-full items-center justify-center rounded-[10px] text-sm font-medium transition-all duration-200 active:scale-[0.98]",
            yesterdayHref
              ? "border border-white/15 bg-white/[0.04] text-white hover:bg-white/[0.07]"
              : "bg-[var(--accent)] text-black hover:brightness-105",
          )}
        >
          Открыть Архив — сыграть ещё
        </Link>
      </div>

      {isDaily && <ComeBackTomorrow showStreak={won} />}
    </div>
  );
}

function BreakdownRow({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-center justify-between gap-3 text-white/70">
      <span className="text-white/45">{label}</span>
      <span className="font-medium tabular-nums text-white">{value}</span>
    </li>
  );
}
