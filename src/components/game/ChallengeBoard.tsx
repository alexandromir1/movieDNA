"use client";

import { useState } from "react";
import Link from "next/link";

import { ProgressiveRevealImage } from "@/components/ProgressiveRevealImage";
import { MovieSearchInput } from "@/components/game/MovieSearchInput";
import { Button } from "@/components/ui/Button";
import { REVEAL_REGION_COUNT } from "@/config/economy";
import { useChallenge } from "@/hooks/useChallenge";
import { shareChallengeResult } from "@/lib/game/share-result";

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

  const areaRegions = [...level.revealRegions]
    .filter((region) => region.kind !== "full_image")
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const viewerRegions: ViewerRegion[] = areaRegions.map((region) => ({
    id: region.id,
    label: region.name,
    points: region.polygon,
  }));

  // 1–4: отдельные области; 5 / finish: полное изображение
  const revealLevel =
    visibleRegionCount >= REVEAL_REGION_COUNT || isFinished
      ? viewerRegions.length
      : visibleRegionCount - 1;

  const canOpenMore =
    !isFinished && session.openedRegionCount < REVEAL_REGION_COUNT;

  const isLastAttempt =
    !isFinished && session.openedRegionCount >= REVEAL_REGION_COUNT;

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
          Today&apos;s Challenge
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
          Угадайте фильм по визуальной ДНК. Каждая открытая область снижает Movie
          Score.
        </p>
        <Button size="lg" onClick={startChallenge}>
          Начать Challenge
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-4">
      <div className="mb-4 flex w-full items-center justify-between text-xs uppercase tracking-widest text-white/40">
        <span>MovieDNA</span>
        <span>
          Reveal {Math.min(session.openedRegionCount, REVEAL_REGION_COUNT)}/
          {REVEAL_REGION_COUNT}
        </span>
        <span>
          {session.state === "COMPLETED"
            ? `Score ${session.movieScore}`
            : session.state === "LOST"
              ? "Score —"
              : `Score ${potentialScore}`}
        </span>
      </div>

      <div className="mb-6 w-full overflow-hidden border border-white/10 bg-black">
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
            className={`h-1.5 w-8 ${
              index < session.openedRegionCount ? "bg-white" : "bg-white/15"
            }`}
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
            Movie Score
          </p>

          <ul className="mt-6 space-y-1 text-sm text-white/50">
            <li>Reveal Score: {scoreBreakdown.revealScore}</li>
            <li>Time Bonus: +{scoreBreakdown.timeBonus}</li>
            <li>Guess Bonus: +{scoreBreakdown.guessBonus}</li>
            <li>First Play Bonus: +{scoreBreakdown.firstPlayBonus}</li>
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
          <MovieSearchInput
            value={guess}
            onChange={setGuess}
            onSubmit={(value) => {
              const openedBefore = session.openedRegionCount;
              const result = submitGuess(value);
              setGuess("");
              if (!value.trim()) {
                setFeedback(
                  openedBefore + 1 >= REVEAL_REGION_COUNT
                    ? "Открыто полное изображение — последняя попытка"
                    : "Открыта следующая область",
                );
              } else if (result.isCorrect || result.isLost) {
                setFeedback(null);
              } else if (openedBefore + 1 >= REVEAL_REGION_COUNT) {
                setFeedback("Открыто полное изображение — последняя попытка");
              } else {
                setFeedback("Неверно — открыта следующая область");
              }
              window.setTimeout(() => setFeedback(null), 2500);
            }}
          />

          <div className="mt-4 flex flex-col items-center gap-3">
            <Button
              variant="secondary"
              disabled={!canOpenMore}
              onClick={() => {
                const nextCount = session.openedRegionCount + 1;
                openNextReveal();
                setFeedback(
                  nextCount >= REVEAL_REGION_COUNT
                    ? "Открыто полное изображение — последняя попытка"
                    : "Открыта следующая область",
                );
                window.setTimeout(() => setFeedback(null), 2500);
              }}
            >
              {session.openedRegionCount === REVEAL_REGION_COUNT - 1
                ? "Открыть всё изображение"
                : "Открыть следующую подсказку"}
            </Button>
            {feedback && <p className="text-sm text-white/45">{feedback}</p>}
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
