"use client";

import { useState } from "react";

import { FrameIndicator } from "@/components/game/FrameIndicator";
import { MovieFrame } from "@/components/game/MovieFrame";
import { MovieSearchInput } from "@/components/game/MovieSearchInput";
import { ShareResult } from "@/components/game/ShareResult";
import { buildEmojiGrid } from "@/lib/game/share";
import { getPuzzleNumber } from "@/lib/game/utils";
import { useGame } from "@/hooks/useGame";

import type { DailyPuzzle, GameAttempt } from "@/types/game";

interface GameBoardProps {
  puzzle: DailyPuzzle;
}

export function GameBoard({ puzzle }: GameBoardProps) {
  const { session, currentFrameUrl, attemptsLeft, submitGuess } = useGame(puzzle);
  const [guess, setGuess] = useState("");

  const isFinished = session.status !== "pending";
  const puzzleNumber = getPuzzleNumber(puzzle.date);
  const lastAttempt = session.attempts.at(-1);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-4">
      <p className="mb-6 text-xs font-medium uppercase tracking-[0.25em] text-white/40">
        Киношка #{puzzleNumber}
      </p>

      <div className="mb-6 w-full">
        <MovieFrame frameUrl={currentFrameUrl} />
      </div>

      <FrameIndicator
        total={puzzle.movie.frameUrls.length}
        current={session.currentFrameIndex}
        revealedCount={session.currentFrameIndex}
      />

      <div className="mt-8 w-full max-w-md">
        {!isFinished ? (
          <>
            <MovieSearchInput
              value={guess}
              onChange={setGuess}
              onSubmit={submitGuess}
            />

            <p className="mt-4 text-center text-xs uppercase tracking-widest text-white/35">
              {attemptsLeft === 1
                ? "Осталась 1 попытка"
                : `Осталось ${attemptsLeft} ${attemptsLeft < 5 ? "попытки" : "попыток"}`}
            </p>

            <p className="mt-2 text-center text-xs text-white/25">
              Пустой ввод — пропустить кадр
            </p>
          </>
        ) : (
          <GameEndState
            won={session.status === "won"}
            movieTitle={puzzle.movie.title}
            movieYear={puzzle.movie.year}
            attemptsUsed={session.attempts.length}
            date={puzzle.date}
            attempts={session.attempts}
          />
        )}
      </div>

      {lastAttempt && !lastAttempt.isCorrect && !isFinished && (
        <p className="mt-6 text-sm text-white/50">
          {lastAttempt.skipped ? "Пропущено" : `«${lastAttempt.guess}» — неверно`}
        </p>
      )}

      {session.attempts.length > 0 && isFinished && (
        <AttemptHistory attempts={session.attempts} />
      )}
    </div>
  );
}

function GameEndState({
  won,
  movieTitle,
  movieYear,
  attemptsUsed,
  date,
  attempts,
}: {
  won: boolean;
  movieTitle: string;
  movieYear: number;
  attemptsUsed: number;
  date: string;
  attempts: GameAttempt[];
}) {
  return (
    <div className="text-center">
      <p className="mb-2 text-xs uppercase tracking-widest text-white/40">
        {won ? "Угадано!" : "Фильм не угадан"}
      </p>
      <p className="text-xl font-medium text-white">
        {movieTitle}
        <span className="ml-2 text-white/40">({movieYear})</span>
      </p>
      <p className="mt-3 text-sm text-white/35">
        {won
          ? `За ${attemptsUsed} ${attemptsUsed === 1 ? "попытку" : attemptsUsed < 5 ? "попытки" : "попыток"}`
          : "Попробуйте завтра"}
      </p>

      <p className="mt-4 text-2xl tracking-widest">{buildEmojiGrid(attempts)}</p>

      <ShareResult date={date} attempts={attempts} won={won} />
    </div>
  );
}

function AttemptHistory({
  attempts,
}: {
  attempts: Array<{ guess: string; skipped: boolean; isCorrect: boolean }>;
}) {
  return (
    <ul className="mt-8 w-full max-w-md space-y-1.5">
      {attempts.map((attempt, index) => (
        <li
          key={index}
          className="flex items-center justify-between text-sm text-white/40"
        >
          <span>{attempt.skipped ? "— пропуск" : attempt.guess}</span>
          <span>{attempt.isCorrect ? "✓" : attempt.skipped ? "→" : "✗"}</span>
        </li>
      ))}
    </ul>
  );
}
