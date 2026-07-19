"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { ChallengeImageViewer } from "@/components/game/ChallengeImageViewer";
import { MovieSearchInput } from "@/components/game/MovieSearchInput";
import { ChallengeResultCard } from "@/components/game/ChallengeResultCard";
import { ChallengeStartScreen } from "@/components/game/ChallengeStartScreen";
import type { NextChallengeLink } from "@/components/game/WhatsNextBlock";
import { Button } from "@/components/ui/Button";
import { REVEAL_REGION_COUNT } from "@/config/economy";
import { FEEDBACK_MESSAGE_MS, WRONG_GUESS_FEEDBACK_MS } from "@/config/game";
import { useChallenge } from "@/hooks/useChallenge";
import type { MovieRecommendationCategoryView } from "@/types/recommendations";
import { addUtcDays, getUtcDateString } from "@/lib/game/daily";
import {
  buildShareText,
  shareChallengeResult,
} from "@/lib/game/share-result";
import { localize } from "@/lib/i18n/localize";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { cn } from "@/lib/utils/cn";

import type { Challenge, Level, Movie } from "@/types/content";
import type { RevealRegion as ViewerRegion } from "@/types/reveal-image";

interface ChallengeBoardProps {
  challenge: Challenge;
  level: Level;
  movie: Movie;
  recommendations?: MovieRecommendationCategoryView[];
  relatedChallenges?: NextChallengeLink[];
  archivePool?: NextChallengeLink[];
}

function triggerWrongGuessVibration() {
  if (
    typeof navigator !== "undefined" &&
    typeof navigator.vibrate === "function"
  ) {
    navigator.vibrate(20);
  }
}

/**
 * Кадр Challenge: на мобилке даём больше высоты кадру,
 * потому что chrome (header/архив) уже сжат — кнопки остаются в первом экране.
 */
function ChallengeImageFrame({
  width,
  height,
  compact = false,
  className,
  children,
}: {
  width: number;
  height: number;
  compact?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const aspect = width / Math.max(height, 1);

  return (
    <div
      className={cn(
        "relative mx-auto overflow-hidden rounded-[10px] border border-white/[0.09] bg-black sm:rounded-[12px]",
        "shadow-[0_8px_40px_rgb(0_0_0/0.4)] transition-all duration-500",
        compact
          ? "[--frame-max-h:min(30dvh,240px)] sm:[--frame-max-h:min(34vh,330px)]"
          : "[--frame-max-h:min(42dvh,340px)] sm:[--frame-max-h:min(52vh,530px)]",
        className,
      )}
      style={{
        aspectRatio: String(aspect),
        maxHeight: "var(--frame-max-h)",
        width: `min(100%, 48rem, calc(var(--frame-max-h) * ${aspect}))`,
      }}
    >
      {children}
    </div>
  );
}

export function ChallengeBoard({
  challenge,
  level,
  movie,
  recommendations = [],
  archivePool = [],
}: ChallengeBoardProps) {
  const {
    session,
    potentialScore,
    scoreBreakdown,
    visibleRegionCount,
    isFinished,
    canSurrender,
    openNextReveal,
    submitGuess,
    surrender,
    startChallenge,
  } = useChallenge({ challenge, level, movie });
  const { locale, t } = useLocale();

  const [guess, setGuess] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [shareFallbackText, setShareFallbackText] = useState<string | null>(
    null,
  );
  const [isWrongGuess, setIsWrongGuess] = useState(false);
  const [imageExpanded, setImageExpanded] = useState(
    () => session.state === "COMPLETED" || session.state === "LOST",
  );
  /** Win beat: короткая пауза на полном кадре → экран результата */
  const [winBeat, setWinBeat] = useState<"image" | "result">(() =>
    session.state === "COMPLETED" || session.state === "LOST" ? "result" : "image",
  );
  const skipWinIntroRef = useRef(
    session.state === "COMPLETED" || session.state === "LOST",
  );
  const wrongGuessTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (wrongGuessTimeoutRef.current !== null) {
        window.clearTimeout(wrongGuessTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (session.state !== "COMPLETED") {
      if (session.state !== "LOST") setWinBeat("image");
      return;
    }

    if (skipWinIntroRef.current) {
      setWinBeat("result");
      return;
    }

    setWinBeat("image");
    const resultTimer = window.setTimeout(() => setWinBeat("result"), 420);
    return () => {
      window.clearTimeout(resultTimer);
    };
  }, [session.state]);

  const areaRegions = [...level.revealRegions]
    .filter((region) => region.kind !== "full_image")
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const viewerRegions: ViewerRegion[] = areaRegions.map((region) => ({
    id: region.id,
    label: region.name,
    points: region.polygon,
  }));

  const revealLevel =
    visibleRegionCount >= REVEAL_REGION_COUNT || isFinished
      ? viewerRegions.length
      : visibleRegionCount - 1;

  const canOpenMore =
    !isFinished && session.openedRegionCount < REVEAL_REGION_COUNT;

  const imageCompact = isFinished && !imageExpanded;
  const isArchiveChallenge = challenge.date < getUtcDateString();
  const isDaily = !isArchiveChallenge;

  const yesterdayHref = useMemo(() => {
    const yesterday = addUtcDays(getUtcDateString(), -1);
    if (challenge.date === yesterday) return null;
    const match = archivePool.find((item) => item.date === yesterday);
    return match ? `/game/${match.date}` : null;
  }, [archivePool, challenge.date]);

  function showTemporaryFeedback(message: string) {
    setFeedback(message);
    window.setTimeout(() => setFeedback(null), FEEDBACK_MESSAGE_MS);
  }

  function playWrongGuessFeedback(
    submittedValue: string,
    followUpMessage: string | null,
  ) {
    setIsWrongGuess(true);
    setGuess(submittedValue);
    triggerWrongGuessVibration();

    if (wrongGuessTimeoutRef.current !== null) {
      window.clearTimeout(wrongGuessTimeoutRef.current);
    }

    wrongGuessTimeoutRef.current = window.setTimeout(() => {
      setIsWrongGuess(false);
      setGuess("");
      if (followUpMessage) {
        showTemporaryFeedback(followUpMessage);
      }
    }, WRONG_GUESS_FEEDBACK_MS);
  }

  function handleGuessSubmit(value: string) {
    const openedBefore = session.openedRegionCount;
    const submitted = value.trim();
    const result = submitGuess(value);

    if (!submitted) {
      setGuess("");
      showTemporaryFeedback(
        openedBefore + 1 >= REVEAL_REGION_COUNT
          ? t("game.openedFullLast")
          : t("game.openedNext"),
      );
      return;
    }

    if (result.isCorrect || result.isLost) {
      setGuess("");
      setFeedback(null);
      return;
    }

    const followUp =
      openedBefore + 1 >= REVEAL_REGION_COUNT
        ? t("game.openedFullLast")
        : t("game.openedNext");

    playWrongGuessFeedback(submitted, followUp);
  }

  async function handleShare() {
    if (!scoreBreakdown) return;
    const movieTitle = localize(movie.title, locale);
    const result = await shareChallengeResult({
      movieTitle,
      movieScore: scoreBreakdown.total,
      openedRegionCount: session.openedRegionCount,
      elapsedSeconds: scoreBreakdown.elapsedSeconds,
      won: true,
      locale,
    });

    if (result === "cancelled") return;

    if (result === "failed") {
      setShareFallbackText(
        buildShareText({
          movieTitle,
          movieScore: scoreBreakdown.total,
          openedRegionCount: session.openedRegionCount,
          elapsedSeconds: scoreBreakdown.elapsedSeconds,
          won: true,
          locale,
        }),
      );
      setShareFeedback(t("game.copyManual"));
      return;
    }

    setShareFallbackText(null);
    setShareFeedback(
      result === "copied" ? t("game.copied") : t("game.shared"),
    );
    window.setTimeout(() => setShareFeedback(null), 2200);
  }

  const image = (
    <ChallengeImageFrame
      width={level.width}
      height={level.height}
      compact={imageCompact}
      className={cn(
        isWrongGuess && "wrong-guess-flash",
        session.state === "COMPLETED" && "result-win-frame",
        session.state === "LOST" && "result-lose-frame",
      )}
    >
      <ChallengeImageViewer
        imageSrc={level.image}
        revealLevel={session.state === "NOT_STARTED" ? -1 : revealLevel}
        regions={viewerRegions}
        width={level.width}
        height={level.height}
        zoomEnabled={session.state !== "NOT_STARTED"}
        className="h-full max-h-full w-full"
      />
    </ChallengeImageFrame>
  );

  const progressSegments = (
    <div className="flex flex-1 gap-1">
      {Array.from({ length: REVEAL_REGION_COUNT }, (_, index) => (
        <span
          key={index}
          className={cn(
            "h-1 min-w-0 flex-1 rounded-full transition-colors duration-500 sm:h-1.5 sm:w-9 sm:flex-none",
            index < session.openedRegionCount
              ? isWrongGuess
                ? "bg-rose-300/70"
                : session.state === "COMPLETED"
                  ? "bg-[var(--accent)]"
                  : session.state === "LOST"
                    ? "bg-rose-300/50"
                    : "bg-[var(--accent)]"
              : "bg-white/[0.12]",
          )}
        />
      ))}
    </div>
  );

  if (session.state === "NOT_STARTED") {
    return (
      <ChallengeStartScreen image={image} onStart={startChallenge} />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center pb-[max(0.25rem,env(safe-area-inset-bottom))]">
      <div className="mb-1.5 flex w-full items-center gap-2 sm:mb-3 sm:gap-3">
        {progressSegments}
        <span className="shrink-0 text-[10px] font-medium uppercase tracking-wider text-white/40 sm:text-[11px]">
          {Math.min(session.openedRegionCount, REVEAL_REGION_COUNT)}/
          {REVEAL_REGION_COUNT}
        </span>
        <span
          className={cn(
            "shrink-0 text-[10px] font-medium uppercase tracking-wider sm:text-[11px]",
            session.state !== "LOST" &&
              session.state !== "COMPLETED" &&
              "text-[var(--accent)]/80",
            (session.state === "LOST" || session.state === "COMPLETED") &&
              "text-white/40",
          )}
        >
          {session.state === "COMPLETED"
            ? session.movieScore
            : session.state === "LOST"
              ? "—"
              : potentialScore}
        </span>
      </div>

      <div className="mb-2 w-full sm:mb-4">{image}</div>

      {(session.state === "COMPLETED" && winBeat === "result") ||
      session.state === "LOST" ? (
        <ChallengeResultCard
          movie={movie}
          won={session.state === "COMPLETED"}
          isDaily={isDaily}
          challengeId={challenge.id}
          challengeDate={challenge.date}
          scoreBreakdown={scoreBreakdown}
          openedRegionCount={session.openedRegionCount}
          hasCollections={recommendations.length > 0}
          archivePool={archivePool}
          yesterdayHref={yesterdayHref}
          imageExpanded={imageExpanded}
          onExpandImage={() => setImageExpanded(true)}
          onShare={() => void handleShare()}
          shareFeedback={shareFeedback}
          shareFallbackText={shareFallbackText}
        />
      ) : (
        <div className="w-full max-w-md">
          <div className={cn(isWrongGuess && "wrong-guess-shake")}>
            <MovieSearchInput
              value={guess}
              onChange={setGuess}
              disabled={isWrongGuess}
              isError={isWrongGuess}
              hideSubmitButton
              onSubmit={handleGuessSubmit}
            />
          </div>

          {isWrongGuess && (
            <p className="wrong-guess-message mt-1.5 text-center text-xs text-rose-300/80 sm:mt-2 sm:text-sm">
              {t("game.wrongShort")}
            </p>
          )}

          <div className="mt-2.5 grid grid-cols-2 gap-2 sm:mt-4 sm:gap-2.5">
            <Button
              size="lg"
              className="h-10 w-full px-2 text-xs sm:h-12 sm:px-8 sm:text-sm"
              disabled={isWrongGuess || guess.trim().length === 0}
              onClick={() => handleGuessSubmit(guess)}
            >
              <span className="sm:hidden">{t("game.check")}</span>
              <span className="hidden sm:inline">{t("game.checkAnswer")}</span>
            </Button>

            {canSurrender ? (
              <Button
                variant="secondary"
                size="lg"
                className="h-10 w-full px-2 text-xs border-rose-300/25 text-rose-100/85 hover:border-rose-300/40 hover:bg-rose-400/[0.08] sm:h-12 sm:px-8 sm:text-sm"
                disabled={isWrongGuess}
                onClick={surrender}
              >
                {t("game.surrender")}
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="lg"
                className="h-10 w-full px-2 text-xs sm:h-12 sm:px-8 sm:text-sm"
                disabled={!canOpenMore || isWrongGuess}
                onClick={() => {
                  const nextCount = session.openedRegionCount + 1;
                  openNextReveal();
                  showTemporaryFeedback(
                    nextCount >= REVEAL_REGION_COUNT
                      ? t("game.openedFullLast")
                      : t("game.openedNext"),
                  );
                }}
              >
                {session.openedRegionCount === REVEAL_REGION_COUNT - 1 ? (
                  <>
                    <span className="sm:hidden">{t("game.openAll")}</span>
                    <span className="hidden sm:inline">
                      {t("game.openAllFull")}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="sm:hidden">{t("game.hint")}</span>
                    <span className="hidden sm:inline">
                      {t("game.hintNext")}
                    </span>
                  </>
                )}
              </Button>
            )}
          </div>

          <div className="mt-2 flex flex-col items-center gap-1 sm:mt-3 sm:gap-1.5">
            {feedback && !isWrongGuess && (
              <p className="text-center text-sm text-white/45">{feedback}</p>
            )}
            <p className="text-center text-[11px] text-white/25">
              {canSurrender ? t("game.allHintsOpen") : t("game.checkFirst")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
