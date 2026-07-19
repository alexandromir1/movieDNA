"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { ComeBackTomorrow } from "@/components/game/ComeBackTomorrow";
import { MovieTitle } from "@/components/i18n/MovieTitle";
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
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { pluralForm } from "@/lib/i18n/plural";
import { cn } from "@/lib/utils/cn";

import type { Movie } from "@/types/content";

export function formatElapsedClock(seconds: number): string {
  const mins = Math.floor(Math.max(0, seconds) / 60);
  const secs = Math.max(0, seconds) % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
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
  const { locale, t, messages } = useLocale();

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

  function winHeadline(count: number): string {
    if (count <= 1) return t("result.winFirstLook");
    if (count <= 2) return t("result.winGotIt");
    if (count <= 3) return t("result.winStrong");
    return t("result.winManaged");
  }

  function formatOpenedHintsLine(count: number): string {
    const n = Math.max(0, count);
    if (n <= 0) return t("result.hintsNotOpened");
    const word = messages.share.hintWord[pluralForm(n, locale)];
    return t("result.hintsOpened", { n, word });
  }

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

          <MovieTitle
            title={movie.title}
            showAlternate={false}
            className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-3xl"
          />
          <p className="mt-0.5 text-xs text-white/35">{movie.year}</p>

          <p className="mt-5 text-[10px] font-medium uppercase tracking-[0.35em] text-white/40">
            {t("result.movieScore")}
          </p>
          <p className="mt-1 text-6xl font-bold tabular-nums tracking-tight text-white sm:text-7xl">
            {scoreBreakdown.total}
          </p>
        </div>
      ) : (
        <div className="relative z-[1]">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rose-300/90">
            {t("result.loseHeadline")}
          </p>
          <p className="mt-4 text-[11px] uppercase tracking-[0.25em] text-white/35">
            {t("result.correctAnswer")}
          </p>
          <MovieTitle
            title={movie.title}
            showAlternate={false}
            className="mt-1 text-3xl font-semibold tracking-tight text-white sm:text-4xl"
          />
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
            {t("result.viewFullImage")}
          </Button>
        )}

        {isDaily ? (
          yesterdayHref ? (
            <Link
              href={yesterdayHref}
              className="inline-flex h-14 w-full items-center justify-center rounded-[12px] bg-[var(--accent)] text-base font-semibold text-black transition-all duration-200 hover:brightness-105 active:scale-[0.98]"
            >
              {t("result.playYesterdayChallenge")}
            </Link>
          ) : (
            <div className="rounded-[12px] border border-white/[0.09] bg-white/[0.03] px-4 py-4">
              <p className="text-sm font-medium text-white">
                {t("result.comeBackTomorrow")}
              </p>
              <p className="mt-1 text-xs text-white/40">
                {t("result.comeBackTomorrowBody")}
              </p>
            </div>
          )
        ) : nextArchive ? (
          <Link
            href={`/game/${nextArchive.date}`}
            className="inline-flex h-14 w-full flex-col items-center justify-center rounded-[12px] bg-[var(--accent)] text-black transition-all duration-200 hover:brightness-105 active:scale-[0.98]"
          >
            <span className="text-base font-semibold">
              {t("result.continueArchive")}
            </span>
            <span className="text-xs font-medium text-black/70">
              {formatHeaderDateShort(nextArchive.date, locale)}
            </span>
          </Link>
        ) : (
          <>
            <Link
              href={GAME_ROUTES.today}
              className="inline-flex h-14 w-full items-center justify-center rounded-[12px] bg-[var(--accent)] text-base font-semibold text-black transition-all duration-200 hover:brightness-105 active:scale-[0.98]"
            >
              {t("result.playTodayChallenge")}
            </Link>
            <Link
              href={GAME_ROUTES.archive}
              className="inline-flex h-11 w-full items-center justify-center rounded-[10px] border border-white/15 bg-white/[0.04] text-sm font-medium text-white transition-all duration-200 hover:bg-white/[0.07] active:scale-[0.98]"
            >
              {t("result.backToArchive")}
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
            {t("result.marathonTitle")}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-white/45">
            {t("result.marathonBody")}
          </p>
          <p className="mt-3 text-sm font-medium text-[var(--accent)]">
            {t("result.marathonCta")}
          </p>
        </Link>
      )}

      {/* 4. Share */}
      {won && scoreBreakdown && (
        <div className="relative z-[1] mt-5 overflow-hidden rounded-[16px] border border-[var(--accent)]/40 bg-gradient-to-b from-[var(--accent)]/[0.14] to-black/40 px-4 py-5 text-left shadow-[0_0_48px_rgb(244_197_63_/_0.1)]">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[var(--accent)]">
              {t("share.title")}
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
                {t("result.movieScore")}
              </p>
              <p className="mt-0.5 text-4xl font-bold tabular-nums text-white">
                {scoreBreakdown.total}
              </p>
            </div>
            <div className="pb-1 text-right text-xs leading-relaxed text-white/50">
              <p>
                {formatHintsShareLine(
                  scoreBreakdown.openedRegionCount,
                  locale,
                )}
              </p>
              <p>{timeLabel}</p>
            </div>
          </div>

          <Button
            variant="secondary"
            size="lg"
            className="mt-4 w-full border-[var(--accent)]/50 bg-[var(--accent)] text-sm font-semibold text-black hover:brightness-105"
            onClick={onShare}
          >
            {t("result.shareAchievement")}
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
            <span>{t("result.howScore")}</span>
            <span className="text-white/40" aria-hidden>
              {breakdownOpen ? "▲" : "▼"}
            </span>
          </button>
          {breakdownOpen && (
            <ul className="mt-2 space-y-2 rounded-[14px] border border-white/[0.08] bg-black/30 px-4 py-3.5 text-sm">
              <BreakdownRow
                label={t("result.hintsUsed")}
                value={`${scoreBreakdown.openedRegionCount}/${REVEAL_REGION_COUNT}`}
              />
              <BreakdownRow
                label={t("result.time")}
                value={timeLabel ?? "—"}
              />
              <BreakdownRow
                label={t("result.hintPoints")}
                value={String(scoreBreakdown.revealScore)}
              />
              {scoreBreakdown.timeBonus > 0 && (
                <BreakdownRow
                  label={t("result.timeBonus")}
                  value={`+${scoreBreakdown.timeBonus}`}
                />
              )}
              {scoreBreakdown.guessBonus > 0 && (
                <BreakdownRow
                  label={
                    scoreBreakdown.wrongGuessCount === 0
                      ? t("result.firstTry")
                      : t("result.guessBonus")
                  }
                  value={`+${scoreBreakdown.guessBonus}`}
                />
              )}
              {scoreBreakdown.firstPlayBonus > 0 && (
                <BreakdownRow
                  label={t("result.firstPlay")}
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
