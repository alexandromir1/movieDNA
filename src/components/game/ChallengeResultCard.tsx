"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { ComeBackTomorrow } from "@/components/game/ComeBackTomorrow";
import { Button } from "@/components/ui/Button";
import { REVEAL_REGION_COUNT } from "@/config/economy";
import type { MovieScoreBreakdown } from "@/engine/score";
import {
  getNextArchiveChallenge,
  type ArchiveChallengeLink,
} from "@/lib/content/next-archive";
import { GAME_ROUTES } from "@/lib/game/constants";
import { formatHeaderDateShort } from "@/lib/game/format-date";
import { loadPlayerStats } from "@/lib/game/player-stats";
import { formatHintsShareLine } from "@/lib/game/share-result";
import { cn } from "@/lib/utils/cn";

import type { Movie } from "@/types/content";

function hintNoun(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return "подсказка";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return "подсказки";
  }
  return "подсказок";
}

function formatOpenedHintsLine(openedRegionCount: number): string {
  const count = Math.max(0, openedRegionCount);
  if (count <= 0) return "Подсказки не открыты";
  return `Открыто ${count} ${hintNoun(count)}`;
}

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
  challengeId: string;
  challengeDate: string;
  scoreBreakdown: MovieScoreBreakdown | null;
  openedRegionCount: number;
  /** Есть ли ручные подборки — только флаг, список на отдельной странице */
  hasCollections: boolean;
  archivePool: ArchiveChallengeLink[];
  yesterdayHref: string | null;
  imageExpanded: boolean;
  onExpandImage: () => void;
  onShare: () => void;
  shareFeedback: string | null;
  shareFallbackText?: string | null;
}

/**
 * Post-game: эмоция → следующий шаг → киномарафон → share → breakdown.
 * Score не пересчитывает — только показывает Engine breakdown.
 */
export function ChallengeResultCard({
  movie,
  won,
  isDaily,
  challengeId,
  challengeDate,
  scoreBreakdown,
  openedRegionCount,
  hasCollections,
  archivePool,
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

  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [breakdownOpen, setBreakdownOpen] = useState(false);

  useEffect(() => {
    const ids = new Set(
      loadPlayerStats().completedChallenges.map((record) => record.challengeId),
    );
    ids.add(challengeId);
    setCompletedIds(ids);
  }, [challengeId]);

  const nextArchive = useMemo(() => {
    if (isDaily) return null;
    return getNextArchiveChallenge(archivePool, {
      currentChallengeId: challengeId,
      currentDate: challengeDate,
      completedChallengeIds: completedIds,
    });
  }, [archivePool, challengeDate, challengeId, completedIds, isDaily]);

  const collectionsHref = hasCollections
    ? GAME_ROUTES.movieRecommendations(movie.id.replace(/^movie-/, ""))
    : null;

  return (
    <div
      className={cn(
        "relative w-full max-w-md text-center",
        won ? "result-win" : "result-lose",
      )}
    >
      {won && <ConfettiOverlay />}

      {/* 1. Emotion + Score */}
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
          <p className="mt-3 text-xs text-white/40">
            {formatOpenedHintsLine(openedRegionCount)}
          </p>
        </div>
      )}

      {/* 2. Primary next action — above the fold */}
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

        {isDaily ? (
          yesterdayHref ? (
            <Link
              href={yesterdayHref}
              className="inline-flex h-14 w-full items-center justify-center rounded-[12px] bg-[var(--accent)] text-base font-semibold text-black transition-all duration-200 hover:brightness-105 active:scale-[0.98]"
            >
              Пройти вчерашний Challenge →
            </Link>
          ) : (
            <div className="rounded-[12px] border border-white/[0.09] bg-white/[0.03] px-4 py-4">
              <p className="text-sm font-medium text-white">Вернуться завтра</p>
              <p className="mt-1 text-xs text-white/40">
                Новый Daily Challenge уже ждёт тебя утром.
              </p>
            </div>
          )
        ) : nextArchive ? (
          <Link
            href={`/game/${nextArchive.date}`}
            className="inline-flex h-14 w-full flex-col items-center justify-center rounded-[12px] bg-[var(--accent)] text-black transition-all duration-200 hover:brightness-105 active:scale-[0.98]"
          >
            <span className="text-base font-semibold">Продолжить архив →</span>
            <span className="text-xs font-medium text-black/70">
              {formatHeaderDateShort(nextArchive.date)}
            </span>
          </Link>
        ) : (
          <>
            <Link
              href={GAME_ROUTES.today}
              className="inline-flex h-14 w-full items-center justify-center rounded-[12px] bg-[var(--accent)] text-base font-semibold text-black transition-all duration-200 hover:brightness-105 active:scale-[0.98]"
            >
              Играть сегодняшний Challenge
            </Link>
            <Link
              href={GAME_ROUTES.archive}
              className="inline-flex h-11 w-full items-center justify-center rounded-[10px] border border-white/15 bg-white/[0.04] text-sm font-medium text-white transition-all duration-200 hover:bg-white/[0.07] active:scale-[0.98]"
            >
              Вернуться в Архив
            </Link>
          </>
        )}
      </div>

      {isDaily && <ComeBackTomorrow showStreak={won} />}

      {/* 3. Movie Collections — compact card only */}
      {collectionsHref && (
        <Link
          href={collectionsHref}
          className="relative z-[1] mt-5 block w-full rounded-[14px] border border-white/[0.1] bg-white/[0.04] px-4 py-4 text-left transition-colors hover:bg-white/[0.07]"
        >
          <p className="text-sm font-semibold text-white">
            🎬 Киномарафон
          </p>
          <p className="mt-1 text-xs leading-relaxed text-white/45">
            Мы подобрали фильмы, которые похожи на этот.
          </p>
          <p className="mt-3 text-sm font-medium text-[var(--accent)]">
            Открыть подборку →
          </p>
        </Link>
      )}

      {/* 4. Share */}
      {won && scoreBreakdown && (
        <div className="relative z-[1] mt-5 overflow-hidden rounded-[16px] border border-[var(--accent)]/40 bg-gradient-to-b from-[var(--accent)]/[0.14] to-black/40 px-4 py-5 text-left shadow-[0_0_48px_rgb(244_197_63_/_0.1)]">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[var(--accent)]">
              MovieDNA
            </p>
            <p
              className="font-mono text-sm tracking-widest text-white/55"
              aria-hidden
            >
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
              <p>{formatHintsShareLine(scoreBreakdown.openedRegionCount)}</p>
              <p>{timeLabel}</p>
            </div>
          </div>

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

      {/* 5. Breakdown — collapsed */}
      {won && scoreBreakdown && (
        <div className="relative z-[1] mt-4 text-left">
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-[10px] border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white/70 transition-colors hover:bg-white/[0.06]"
            onClick={() => setBreakdownOpen((open) => !open)}
            aria-expanded={breakdownOpen}
          >
            <span>Как рассчитаны очки</span>
            <span className="text-white/40" aria-hidden>
              {breakdownOpen ? "▲" : "▼"}
            </span>
          </button>
          {breakdownOpen && (
            <ul className="mt-2 space-y-2 rounded-[14px] border border-white/[0.08] bg-black/30 px-4 py-3.5 text-sm">
              <BreakdownRow
                label="Подсказки"
                value={`${scoreBreakdown.openedRegionCount}/${REVEAL_REGION_COUNT}`}
              />
              <BreakdownRow label="Время" value={timeLabel ?? "—"} />
              <BreakdownRow
                label="Очки за открытые подсказки"
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
        </div>
      )}
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
