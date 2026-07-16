"use client";

import { useCallback, useEffect, useState } from "react";

import { REVEAL_REGION_COUNT } from "@/config/economy";
import {
  createInitialSession,
  loadGameSession,
  saveGameSession,
} from "@/lib/game/storage";
import { recordGameResult } from "@/lib/game/stats";
import { titlesMatch } from "@/lib/game/title-match";

import type { DailyPuzzle, GameSession } from "@/types/game";

interface UseGameReturn {
  session: GameSession;
  currentFrameUrl: string;
  attemptsLeft: number;
  submitGuess: (guess: string) => void;
}

/** @deprecated Используйте useChallenge — оставлен для совместимости старых экранов */
export function useGame(puzzle: DailyPuzzle): UseGameReturn {
  const [session, setSession] = useState<GameSession>(() => {
    const saved = loadGameSession(puzzle.id);
    return (
      saved ??
      createInitialSession(puzzle.id, puzzle.date, REVEAL_REGION_COUNT)
    );
  });

  useEffect(() => {
    saveGameSession(session);
  }, [session]);

  useEffect(() => {
    if (session.status === "pending") return;

    recordGameResult(
      session.date,
      session.status === "won",
      session.attempts.length,
    );
  }, [session.status, session.date, session.attempts.length]);

  const currentFrameUrl =
    puzzle.movie.frameUrls[session.currentFrameIndex] ?? puzzle.movie.frameUrls.at(-1)!;

  const attemptsLeft = session.maxAttempts - session.attempts.length;

  const submitGuess = useCallback(
    (guess: string) => {
      setSession((prev) => {
        if (prev.status !== "pending") return prev;
        if (prev.attempts.length >= prev.maxAttempts) return prev;

        const trimmed = guess.trim();
        const skipped = trimmed.length === 0;
        const isCorrect =
          !skipped &&
          titlesMatch(trimmed, puzzle.movie.title, puzzle.movie.titleOriginal);

        const attemptNumber = prev.attempts.length + 1;
        const nextFrameIndex = Math.min(
          prev.currentFrameIndex + 1,
          puzzle.movie.frameUrls.length - 1,
        );

        const attempt = {
          attemptNumber,
          guess: skipped ? "" : trimmed,
          isCorrect,
          skipped,
          createdAt: new Date().toISOString(),
        };

        if (isCorrect) {
          return {
            ...prev,
            attempts: [...prev.attempts, attempt],
            status: "won",
          };
        }

        const attempts = [...prev.attempts, attempt];
        const isLastAttempt = attempts.length >= prev.maxAttempts;

        return {
          ...prev,
          attempts,
          currentFrameIndex: nextFrameIndex,
          status: isLastAttempt ? "lost" : "pending",
        };
      });
    },
    [puzzle.movie.frameUrls.length, puzzle.movie.title, puzzle.movie.titleOriginal],
  );

  return {
    session,
    currentFrameUrl,
    attemptsLeft,
    submitGuess,
  };
}
