"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { ProgressiveRevealImage } from "@/components/ProgressiveRevealImage";
import { MovieSearchInput } from "@/components/game/MovieSearchInput";
import { Button } from "@/components/ui/Button";
import { REVEAL_REGION_COUNT } from "@/config/economy";
import { FEEDBACK_MESSAGE_MS, WRONG_GUESS_FEEDBACK_MS } from "@/config/game";
import { useChallenge } from "@/hooks/useChallenge";
import { GAME_ROUTES } from "@/lib/game/constants";
import { shareChallengeResult } from "@/lib/game/share-result";
import { cn } from "@/lib/utils/cn";

import type { Challenge, Level, Movie } from "@/types/content";
import type { RevealRegion as ViewerRegion } from "@/types/reveal-image";

interface ChallengeBoardProps {
  challenge: Challenge;
  level: Level;
  movie: Movie;
}

function formatElapsed(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs} с`;
  return `${mins} м ${secs} с`;
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
 * Кадр Challenge в фиксированном «окне» viewport:
 * не раздувает страницу, кнопки остаются на экране без скролла.
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
  const maxH = compact ? "min(26vh, 220px)" : "min(36vh, 320px)";

  return (
    <div
      className={cn(
        "mx-auto overflow-hidden border border-white/10 bg-black",
        className,
      )}
      style={{
        aspectRatio: String(aspect),
        maxHeight: maxH,
        width: `min(100%, 36rem, calc(${maxH} * ${aspect}))`,
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

  const [guess, setGuess] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [isWrongGuess, setIsWrongGuess] = useState(false);
  const wrongGuessTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (wrongGuessTimeoutRef.current !== null) {
        window.clearTimeout(wrongGuessTimeoutRef.current);
      }
    };
  }, []);

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

  const isLastAttempt =
    !isFinished && session.openedRegionCount >= REVEAL_REGION_COUNT;

  const imageCompact = isFinished;

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
          ? "Открыто полное изображение — последняя попытка"
          : "Открыта следующая область",
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
        ? "Открыто полное изображение — последняя попытка"
        : "Неверно — открыта следующая область";

    playWrongGuessFeedback(submitted, followUp);
  }

  async function handleShare() {
    if (!scoreBreakdown) return;
    const result = await shareChallengeResult({
      movieTitle: movie.title,
      movieScore: scoreBreakdown.total,
      openedRegionCount: session.openedRegionCount,
      won: true,
    });
    setShareFeedback(
      result === "copied"
        ? "Скопировано"
        : result === "shared"
          ? "Отправлено"
          : "Не удалось",
    );
    window.setTimeout(() => setShareFeedback(null), 2000);
  }

  const image = (
    <ChallengeImageFrame
      width={level.width}
      height={level.height}
      compact={imageCompact}
      className={cn(
        "transition-colors duration-500",
        isWrongGuess && "wrong-guess-flash",
        session.state === "COMPLETED" && "result-win-frame",
        session.state === "LOST" && "result-lose-frame",
      )}
    >
      <ProgressiveRevealImage
        imageSrc={level.image}
        revealLevel={
          session.state === "NOT_STARTED" ? -1 : revealLevel
        }
        regions={viewerRegions}
        width={level.width}
        height={level.height}
        className="h-full max-h-full w-full"
      />
    </ChallengeImageFrame>
  );

  if (session.state === "NOT_STARTED") {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center">
        <p className="mb-3 text-xs uppercase tracking-[0.25em] text-white/40">
          Игра дня
        </p>
        <div className="mb-4 w-full">{image}</div>
        <p className="mb-4 max-w-md text-center text-sm text-white/50">
          Угадайте фильм по визуальной ДНК. Каждая открытая область снижает
          количество очков.
        </p>
        <Button size="lg" onClick={startChallenge}>
          Начать
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center">
      <div className="mb-2 flex w-full items-center justify-between text-[11px] uppercase tracking-widest text-white/40 transition-colors duration-500">
        <span>MovieDNA</span>
        <span>
          Подсказка {Math.min(session.openedRegionCount, REVEAL_REGION_COUNT)}/
          {REVEAL_REGION_COUNT}
        </span>
        <span>
          {session.state === "COMPLETED"
            ? `Очки ${session.movieScore}`
            : session.state === "LOST"
              ? "Очки —"
              : `Очки ${potentialScore}`}
        </span>
      </div>

      <div className="mb-3 w-full">{image}</div>

      <div className="mb-3 flex gap-1.5">
        {Array.from({ length: REVEAL_REGION_COUNT }, (_, index) => (
          <span
            key={index}
            className={cn(
              "h-1 w-7 transition-colors duration-500",
              index < session.openedRegionCount
                ? isWrongGuess
                  ? "bg-rose-300/70"
                  : session.state === "COMPLETED"
                    ? "bg-emerald-300"
                    : session.state === "LOST"
                      ? "bg-white/50"
                      : "bg-white"
                : "bg-white/15",
            )}
          />
        ))}
      </div>

      {session.state === "COMPLETED" && scoreBreakdown ? (
        <div className="result-win w-full max-w-md text-center">
          <p className="mb-1 text-xs font-medium tracking-[0.2em] text-emerald-300/90 uppercase">
            Отлично!
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {movie.title}
          </h2>
          <p className="mt-1 text-xs text-white/45">
            {movie.titleOriginal ? `${movie.titleOriginal} · ` : ""}
            {movie.year}
          </p>

          <p className="mt-4 text-4xl font-semibold tabular-nums text-white">
            {scoreBreakdown.total}
          </p>
          <p className="mt-0.5 text-[10px] uppercase tracking-[0.25em] text-white/40">
            Movie Score
          </p>

          <p className="mt-3 text-xs text-white/40">
            Подсказки {scoreBreakdown.openedRegionCount}/{REVEAL_REGION_COUNT}
            {" · "}
            {formatElapsed(scoreBreakdown.elapsedSeconds)}
            {" · "}+{scoreBreakdown.timeBonus + scoreBreakdown.guessBonus + scoreBreakdown.firstPlayBonus}{" "}
            бонусы
          </p>

          <div className="mt-5 flex w-full flex-col gap-2">
            <Button
              size="lg"
              className="w-full"
              onClick={() => void handleShare()}
            >
              Поделиться
            </Button>
            {shareFeedback && (
              <p className="text-xs text-white/40">{shareFeedback}</p>
            )}
            <Link
              href={GAME_ROUTES.archive}
              className="inline-flex h-11 w-full items-center justify-center border border-white/20 bg-transparent text-sm font-medium text-white transition-colors hover:border-white/40"
            >
              Пройти предыдущие Challenge
            </Link>
            <Link
              href={GAME_ROUTES.stats}
              className="text-xs text-white/35 underline-offset-4 hover:text-white/70 hover:underline"
            >
              Статистика
            </Link>
          </div>
        </div>
      ) : session.state === "LOST" ? (
        <div className="result-lose w-full max-w-md text-center">
          <p className="mb-1 text-[10px] uppercase tracking-[0.25em] text-white/35">
            Ответ
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {movie.title}
          </h2>
          {movie.titleOriginal && (
            <p className="mt-1 text-sm text-white/50">{movie.titleOriginal}</p>
          )}
          <p className="mt-0.5 text-xs text-white/35">{movie.year}</p>

          <p className="mt-4 text-sm text-white/45">
            В этот раз не вышло. Рассмотри кадр — и наверстай другие дни в
            архиве.
          </p>

          <div className="mt-5 flex w-full flex-col gap-2">
            <Link
              href={GAME_ROUTES.archive}
              className="inline-flex h-11 w-full items-center justify-center bg-white text-sm font-medium text-black transition-colors hover:bg-white/90"
            >
              Попробовать предыдущие Challenge
            </Link>
            <Link
              href={GAME_ROUTES.stats}
              className="text-xs text-white/35 underline-offset-4 hover:text-white/70 hover:underline"
            >
              Статистика
            </Link>
          </div>
        </div>
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
            <p className="wrong-guess-message mt-2 text-center text-sm text-rose-300/80">
              Неверно
            </p>
          )}

          <div className="mt-3 flex flex-col gap-2">
            <Button
              size="lg"
              className="w-full"
              disabled={isWrongGuess || guess.trim().length === 0}
              onClick={() => handleGuessSubmit(guess)}
            >
              Проверить ответ
            </Button>

            <Button
              variant="secondary"
              className="w-full"
              disabled={!canOpenMore || isWrongGuess}
              onClick={() => {
                const nextCount = session.openedRegionCount + 1;
                openNextReveal();
                showTemporaryFeedback(
                  nextCount >= REVEAL_REGION_COUNT
                    ? "Открыто полное изображение — последняя попытка"
                    : "Открыта следующая область",
                );
              }}
            >
              {session.openedRegionCount === REVEAL_REGION_COUNT - 1
                ? "Открыть всё изображение"
                : "Открыть следующую подсказку"}
            </Button>

            {canSurrender && (
              <button
                type="button"
                disabled={isWrongGuess}
                onClick={surrender}
                className="h-9 w-full text-sm text-white/35 transition-colors hover:text-rose-200/80 disabled:opacity-40"
              >
                Сдаться
              </button>
            )}

            {feedback && !isWrongGuess && (
              <p className="text-center text-sm text-white/45">{feedback}</p>
            )}
            <p className="text-center text-[11px] text-white/25">
              {isLastAttempt
                ? "Последняя попытка. Можно угадать или сдаться."
                : "Сначала проверь ответ — подсказка открывается только если нужно"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
