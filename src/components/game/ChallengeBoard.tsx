"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { ProgressiveRevealImage } from "@/components/ProgressiveRevealImage";
import { MovieSearchInput } from "@/components/game/MovieSearchInput";
import { Button } from "@/components/ui/Button";
import { REVEAL_REGION_COUNT } from "@/config/economy";
import { FEEDBACK_MESSAGE_MS, WRONG_GUESS_FEEDBACK_MS } from "@/config/game";
import { useChallenge } from "@/hooks/useChallenge";
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
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    navigator.vibrate(20);
  }
}

export function ChallengeBoard({ challenge, level, movie }: ChallengeBoardProps) {
  const {
    session,
    potentialScore,
    scoreBreakdown,
    visibleRegionCount,
    isFinished,
    openNextReveal,
    submitGuess,
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

  function showTemporaryFeedback(message: string) {
    setFeedback(message);
    window.setTimeout(() => setFeedback(null), FEEDBACK_MESSAGE_MS);
  }

  function playWrongGuessFeedback(submittedValue: string, followUpMessage: string | null) {
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

  if (session.state === "NOT_STARTED") {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-4">
        <p className="mb-4 text-xs uppercase tracking-[0.25em] text-white/40">
          Игра дня
        </p>
        <div className="mb-6 w-full overflow-hidden border border-white/10 bg-black">
          <ProgressiveRevealImage
            imageSrc={level.image}
            revealLevel={-1}
            regions={viewerRegions}
            width={level.width}
            height={level.height}
          />
        </div>
        <p className="mb-6 max-w-md text-center text-sm text-white/50">
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
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-4">
      <div className="mb-4 flex w-full items-center justify-between text-xs uppercase tracking-widest text-white/40 transition-colors duration-500">
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

      <div
        className={cn(
          "mb-6 w-full overflow-hidden border border-white/10 bg-black transition-colors duration-500",
          isWrongGuess && "wrong-guess-flash",
        )}
      >
        <ProgressiveRevealImage
          imageSrc={level.image}
          revealLevel={revealLevel}
          regions={viewerRegions}
          width={level.width}
          height={level.height}
        />
      </div>

      <div className="mb-6 flex gap-2">
        {Array.from({ length: REVEAL_REGION_COUNT }, (_, index) => (
          <span
            key={index}
            className={cn(
              "h-1.5 w-8 transition-colors duration-500",
              index < session.openedRegionCount
                ? isWrongGuess
                  ? "bg-rose-300/70"
                  : "bg-white"
                : "bg-white/15",
            )}
          />
        ))}
      </div>

      {session.state === "COMPLETED" && scoreBreakdown ? (
        <div className="w-full max-w-md text-center">
          <p className="mb-2 text-xs uppercase tracking-widest text-white/40">
            Победа
          </p>
          <h2 className="text-2xl font-medium text-white">
            {movie.title}
            <span className="ml-2 text-white/40">({movie.year})</span>
          </h2>

          <p className="mt-6 text-4xl font-semibold text-white">
            {scoreBreakdown.total}
          </p>
          <p className="mt-1 text-xs uppercase tracking-widest text-white/40">
            Очки
          </p>

          <ul className="mt-6 space-y-1 text-sm text-white/50">
            <li>За подсказки: {scoreBreakdown.revealScore}</li>
            <li>Бонус за время: +{scoreBreakdown.timeBonus}</li>
            <li>Бонус за точность: +{scoreBreakdown.guessBonus}</li>
            <li>Бонус первого прохождения: +{scoreBreakdown.firstPlayBonus}</li>
            <li>
              Открыто областей: {scoreBreakdown.openedRegionCount}/
              {REVEAL_REGION_COUNT}
            </li>
            <li>Время: {formatElapsed(scoreBreakdown.elapsedSeconds)}</li>
          </ul>

          <div className="mt-8 flex flex-col items-center gap-3">
            <Button variant="secondary" onClick={handleShare}>
              Поделиться
            </Button>
            {shareFeedback && (
              <p className="text-xs text-white/40">{shareFeedback}</p>
            )}
            <Link
              href="/stats"
              className="text-sm text-white/50 underline-offset-4 hover:text-white hover:underline"
            >
              Статистика
            </Link>
          </div>
        </div>
      ) : session.state === "LOST" ? (
        <div className="w-full max-w-md text-center">
          <p className="mb-2 text-xs uppercase tracking-widest text-white/40">
            Игра окончена
          </p>
          <p className="mb-4 text-lg text-white/70">
            Увы, попробуйте в следующий раз
          </p>
          <h2 className="text-2xl font-medium text-white">
            {movie.title}
            <span className="ml-2 text-white/40">({movie.year})</span>
          </h2>
          {movie.titleOriginal && (
            <p className="mt-2 text-sm text-white/40">{movie.titleOriginal}</p>
          )}
          <Link
            href="/stats"
            className="mt-8 inline-block text-sm text-white/50 underline-offset-4 hover:text-white hover:underline"
          >
            Статистика
          </Link>
        </div>
      ) : (
        <div className="w-full max-w-md">
          <div className={cn(isWrongGuess && "wrong-guess-shake")}>
            <MovieSearchInput
              value={guess}
              onChange={setGuess}
              disabled={isWrongGuess}
              isError={isWrongGuess}
              onSubmit={(value) => {
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

                if (result.isCorrect) {
                  setGuess("");
                  setFeedback(null);
                  return;
                }

                if (result.isLost) {
                  setGuess("");
                  setFeedback(null);
                  return;
                }

                const followUp =
                  openedBefore + 1 >= REVEAL_REGION_COUNT
                    ? "Открыто полное изображение — последняя попытка"
                    : "Неверно — открыта следующая область";

                playWrongGuessFeedback(submitted, followUp);
              }}
            />
          </div>

          {isWrongGuess && (
            <p className="wrong-guess-message mt-3 text-center text-sm text-rose-300/80">
              Неверно
            </p>
          )}

          <div className="mt-4 flex flex-col items-center gap-3">
            <Button
              variant="secondary"
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
            {feedback && !isWrongGuess && (
              <p className="text-sm text-white/45">{feedback}</p>
            )}
            <p className="text-center text-xs text-white/25">
              {isLastAttempt
                ? "Последняя попытка. Неверный ответ завершит игру."
                : "Неверный ответ автоматически открывает следующую область"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
