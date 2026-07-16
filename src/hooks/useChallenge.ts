"use client";

import { useCallback, useEffect, useState } from "react";

import { REVEAL_REGION_COUNT } from "@/config/economy";
import { getUtcDateString } from "@/lib/game/daily";
import { isAcceptedAnswer } from "@/lib/game/answer-match";
import { recordChallengeResult } from "@/lib/game/player-stats";
import { calculateMovieScore } from "@/lib/game/score";
import {
  createInitialSession,
  loadGameSession,
  saveGameSession,
} from "@/lib/game/session-storage";
import { countWrongGuesses, getElapsedSeconds } from "@/lib/game/share-result";

import type {
  GameSession,
  Level,
  Movie,
  MovieScoreBreakdown,
} from "@/types/content";

interface ChallengeBundle {
  challenge: { id: string; date: string };
  level: Level;
  movie: Movie;
}

interface UseChallengeReturn {
  session: GameSession;
  potentialScore: number;
  scoreBreakdown: MovieScoreBreakdown | null;
  /** Сколько area-регионов + full показывать в маске */
  visibleRegionCount: number;
  isFinished: boolean;
  openNextReveal: () => void;
  submitGuess: (guess: string) => {
    isCorrect: boolean;
    isLost: boolean;
  };
  startChallenge: () => void;
}

function ensureStarted(session: GameSession): GameSession {
  if (session.state !== "NOT_STARTED") return session;

  return {
    ...session,
    state: "IN_PROGRESS",
    startedAt: session.startedAt ?? new Date().toISOString(),
  };
}

function isTerminal(state: GameSession["state"]): boolean {
  return state === "COMPLETED" || state === "LOST";
}

export function useChallenge(bundle: ChallengeBundle): UseChallengeReturn {
  const { challenge, level, movie } = bundle;
  const playDate = getUtcDateString();

  const [session, setSession] = useState<GameSession>(() => {
    const saved = loadGameSession(challenge.id);
    if (saved) return saved;
    return createInitialSession(challenge.id, playDate);
  });

  useEffect(() => {
    saveGameSession(session);
  }, [session]);

  const wrongGuessCount = countWrongGuesses(session.guesses);
  const elapsedSeconds = getElapsedSeconds(session);
  const isFinished = isTerminal(session.state);

  const potentialScore = calculateMovieScore({
    openedRegionCount: session.openedRegionCount,
    wrongGuessCount,
    elapsedSeconds,
    isFirstPlay: session.isFirstPlay,
  }).total;

  const scoreBreakdown =
    session.state === "COMPLETED"
      ? calculateMovieScore({
          openedRegionCount: session.openedRegionCount,
          wrongGuessCount,
          elapsedSeconds,
          isFirstPlay: session.isFirstPlay,
        })
      : null;

  const visibleRegionCount = isFinished
    ? REVEAL_REGION_COUNT
    : session.openedRegionCount;

  const openNextReveal = useCallback(() => {
    setSession((prev) => {
      if (isTerminal(prev.state)) return prev;
      if (prev.openedRegionCount >= REVEAL_REGION_COUNT) return prev;

      const next = ensureStarted(prev);
      return {
        ...next,
        openedRegionCount: next.openedRegionCount + 1,
      };
    });
  }, []);

  const startChallenge = useCallback(() => {
    setSession((prev) => {
      if (prev.state !== "NOT_STARTED") return prev;
      return {
        ...ensureStarted(prev),
        openedRegionCount: 1,
      };
    });
  }, []);

  const submitGuess = useCallback(
    (guess: string) => {
      const trimmed = guess.trim();
      let isCorrect = false;
      let isLost = false;

      setSession((prev) => {
        if (isTerminal(prev.state)) return prev;

        let next = ensureStarted(prev);

        // Пустой ввод = открыть следующую подсказку (не засчитывается как последняя попытка)
        if (!trimmed) {
          if (next.openedRegionCount >= REVEAL_REGION_COUNT) return next;
          return {
            ...next,
            openedRegionCount: next.openedRegionCount + 1,
          };
        }

        const answers = [
          ...level.acceptedAnswers,
          movie.title,
          movie.titleOriginal ?? "",
          ...movie.aliases,
        ].filter(Boolean);

        isCorrect = isAcceptedAnswer(trimmed, answers);

        const guessRecord = {
          value: trimmed,
          isCorrect,
          createdAt: new Date().toISOString(),
        };

        if (isCorrect) {
          const completedAt = new Date().toISOString();
          const openedForScore = next.openedRegionCount;
          const wrongs = countWrongGuesses([...next.guesses, guessRecord]);
          const elapsed = Math.max(
            0,
            Math.floor(
              (new Date(completedAt).getTime() -
                new Date(next.startedAt ?? completedAt).getTime()) /
                1000,
            ),
          );

          const breakdown = calculateMovieScore({
            openedRegionCount: openedForScore,
            wrongGuessCount: wrongs,
            elapsedSeconds: elapsed,
            isFirstPlay: next.isFirstPlay,
          });

          recordChallengeResult({
            challengeId: challenge.id,
            date: playDate,
            won: true,
            movieScore: breakdown.total,
            openedRegionCount: openedForScore,
            wrongGuessCount: wrongs,
            elapsedSeconds: elapsed,
          });

          return {
            ...next,
            state: "COMPLETED",
            guesses: [...next.guesses, guessRecord],
            completedAt,
            movieScore: breakdown.total,
            openedRegionCount: openedForScore,
          };
        }

        // Уже открыто полное изображение — это была последняя попытка
        if (next.openedRegionCount >= REVEAL_REGION_COUNT) {
          isLost = true;
          const completedAt = new Date().toISOString();
          const wrongs = countWrongGuesses([...next.guesses, guessRecord]);
          const elapsed = Math.max(
            0,
            Math.floor(
              (new Date(completedAt).getTime() -
                new Date(next.startedAt ?? completedAt).getTime()) /
                1000,
            ),
          );

          recordChallengeResult({
            challengeId: challenge.id,
            date: playDate,
            won: false,
            movieScore: 0,
            openedRegionCount: next.openedRegionCount,
            wrongGuessCount: wrongs,
            elapsedSeconds: elapsed,
          });

          return {
            ...next,
            state: "LOST",
            guesses: [...next.guesses, guessRecord],
            completedAt,
            movieScore: 0,
          };
        }

        // Неверно → открыть следующую область (5-я = полное изображение)
        return {
          ...next,
          guesses: [...next.guesses, guessRecord],
          openedRegionCount: next.openedRegionCount + 1,
        };
      });

      return { isCorrect, isLost };
    },
    [
      challenge.id,
      level.acceptedAnswers,
      movie.aliases,
      movie.title,
      movie.titleOriginal,
      playDate,
    ],
  );

  return {
    session,
    potentialScore,
    scoreBreakdown,
    visibleRegionCount,
    isFinished,
    openNextReveal,
    submitGuess,
    startChallenge,
  };
}
