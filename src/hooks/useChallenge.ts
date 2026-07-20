"use client";

import { useEffect, useRef, useState } from "react";

import {
  clearAnalyticsChallengeContext,
  setAnalyticsChallengeContext,
  analytics,
} from "@/analytics";
import {
  clearChallengeTiming,
  getSecondsPlayed,
  hasChallengeTiming,
  resetChallengeTiming,
} from "@/analytics/timing";
import { localize } from "@/lib/i18n/localize";
import { REVEAL_REGION_COUNT } from "@/config/economy";
import { ChallengeSession, calculateMovieScore } from "@/engine";
import { getUtcDateString } from "@/lib/game/daily";
import { recordChallengeResult } from "@/lib/game/player-stats";
import {
  hasCompletedChallengeBefore,
  loadGameSession,
  saveGameSession,
} from "@/lib/game/session-storage";
import { countWrongGuesses } from "@/lib/game/share-result";

import type {
  ChallengeSessionSnapshot,
  ChallengeState,
  MovieScoreBreakdown,
} from "@/engine";
import type { GameGuess, GameSession, Level, Movie } from "@/types/content";

interface ChallengeBundle {
  challenge: { id: string; date: string };
  level: Level;
  movie: Movie;
}

interface UseChallengeReturn {
  session: ChallengeSessionSnapshot;
  potentialScore: number;
  scoreBreakdown: MovieScoreBreakdown | null;
  /** Сколько area-регионов + full показывать в маске */
  visibleRegionCount: number;
  isFinished: boolean;
  /** Все Reveal Regions открыты — можно сдаться */
  canSurrender: boolean;
  openNextReveal: () => void;
  submitGuess: (guess: string) => {
    isCorrect: boolean;
    isLost: boolean;
  };
  /** Сдаться после полного reveal → LOST + экран результата */
  surrender: () => void;
  startChallenge: () => void;
}

function toRevealDefinitions(level: Level) {
  return level.revealRegions.map((region) => ({
    id: region.id,
    displayOrder: region.displayOrder,
    kind: region.kind,
  }));
}

function mapLegacyState(state: GameSession["state"]): ChallengeState {
  if (state === "COMPLETED" || state === "LOST") return state;
  if (state === "NOT_STARTED") return "NOT_STARTED";
  return "WAITING_FOR_GUESS";
}

function mapEngineState(state: ChallengeState): GameSession["state"] {
  if (state === "COMPLETED" || state === "LOST") return state;
  if (state === "NOT_STARTED") return "NOT_STARTED";
  return "IN_PROGRESS";
}

function getElapsedSeconds(
  snapshot: ChallengeSessionSnapshot,
  now = Date.now(),
): number {
  if (!snapshot.startedAt) return 0;
  const end = snapshot.completedAt
    ? new Date(snapshot.completedAt).getTime()
    : now;
  return Math.max(
    0,
    Math.floor((end - new Date(snapshot.startedAt).getTime()) / 1000),
  );
}

export function useChallenge(bundle: ChallengeBundle): UseChallengeReturn {
  const { challenge, level, movie } = bundle;
  /** Дата Challenge (не «сегодня») — нужна для архива и статистики */
  const playDate = challenge.date || getUtcDateString();

  const engineRef = useRef<ChallengeSession | null>(null);
  const initialGuessesRef = useRef<GameGuess[] | null>(null);

  if (!engineRef.current) {
    const saved = loadGameSession(challenge.id);

    engineRef.current = new ChallengeSession({
      challengeId: challenge.id,
      isFirstPlay: saved
        ? (saved.isFirstPlay ?? true)
        : !hasCompletedChallengeBefore(challenge.id),
      regions: toRevealDefinitions(level),
      acceptedAnswers: [
        ...level.acceptedAnswers,
        ...movie.aliases,
        movie.title.ru,
        movie.title.en,
      ].filter(Boolean),
      initialState: saved
        ? {
            state: mapLegacyState(saved.state),
            openedRegionCount: saved.openedRegionCount,
            attemptCount: saved.guesses.length,
            startedAt: saved.startedAt,
            completedAt: saved.completedAt,
            movieScore: saved.movieScore,
          }
        : undefined,
    });
    initialGuessesRef.current = saved?.guesses ?? [];
  }

  const [session, setSession] = useState<ChallengeSessionSnapshot>(() =>
    engineRef.current!.getState(),
  );

  useEffect(() => {
    const genres =
      movie.genres?.filter(Boolean).join(", ").trim() || null;
    setAnalyticsChallengeContext({
      challengeId: challenge.id,
      regionsOpened: session.openedRegionCount,
      hintsUsed: session.openedRegionCount,
      attempts: session.attemptCount,
      movieId: movie.id,
      movieTitle: localize(movie.title, "en") || localize(movie.title, "ru"),
      movieYear: movie.year > 0 ? movie.year : null,
      genres,
    });
    return () => {
      clearAnalyticsChallengeContext();
    };
  }, [
    challenge.id,
    movie,
    session.openedRegionCount,
    session.attemptCount,
  ]);

  /**
   * Challenge Abandoned: начал, но ушёл до COMPLETED/LOST.
   * pagehide / visibility hidden / SPA unmount (после arm, чтобы не ловить Strict Mode).
   */
  useEffect(() => {
    const firedRef = { current: false };
    let armed = false;
    const armTimer = window.setTimeout(() => {
      armed = true;
    }, 600);

    function isInProgress(): boolean {
      const state = engineRef.current?.getState();
      return Boolean(
        state &&
          !state.isFinished &&
          state.state !== "NOT_STARTED" &&
          state.startedAt,
      );
    }

    function fireAbandoned() {
      if (!armed || firedRef.current || !isInProgress()) return;
      firedRef.current = true;
      const snap = engineRef.current?.getState();
      analytics.track("challenge_abandoned", {
        challengeId: challenge.id,
        openedRegionCount: snap?.openedRegionCount ?? 0,
        attemptCount: snap?.attemptCount ?? 0,
        secondsPlayed: hasChallengeTiming()
          ? getSecondsPlayed()
          : undefined,
      });
    }

    function onVisibility() {
      if (document.visibilityState === "hidden") fireAbandoned();
    }

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", fireAbandoned);

    return () => {
      window.clearTimeout(armTimer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", fireAbandoned);
      if (document.visibilityState === "visible") fireAbandoned();
    };
  }, [challenge.id]);

  // Sync abandon "in progress" after start — effect above reads engine on leave.
  useEffect(() => {
    if (
      session.state !== "NOT_STARTED" &&
      !session.isFinished &&
      session.startedAt &&
      !hasChallengeTiming()
    ) {
      resetChallengeTiming();
    }
    if (session.isFinished) {
      clearChallengeTiming();
    }
  }, [session.state, session.isFinished, session.startedAt]);

  // Guess ещё не мигрирован: React временно хранит только историю попыток.
  const [guesses, setGuesses] = useState<GameGuess[]>(
    () => initialGuessesRef.current ?? [],
  );

  function getEngine(): ChallengeSession {
    return engineRef.current!;
  }

  /** Публикует новый read-only Snapshot Engine для React render. */
  function publishSnapshot(): ChallengeSessionSnapshot {
    const next = getEngine().getState();
    setSession(next);
    return next;
  }

  useEffect(() => {
    // Временный legacy Storage shim. Он не является Source of Truth:
    // сохраняется проекция Engine Snapshot + ещё не мигрированные guesses.
    saveGameSession({
      challengeId: session.challengeId,
      date: playDate,
      state: mapEngineState(session.state),
      openedRegionCount: session.openedRegionCount,
      guesses,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      movieScore: session.movieScore,
      isFirstPlay: session.isFirstPlay,
    });
  }, [guesses, playDate, session]);

  const wrongGuessCount = countWrongGuesses(guesses);
  const elapsedSeconds = getElapsedSeconds(session);
  const isFinished = session.isFinished;

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

  function openNextReveal(): void {
    const engine = getEngine();
    if (engine.getState().isFinished) return;
    if (engine.getState().state === "NOT_STARTED") engine.start();
    engine.openNextReveal();
    publishSnapshot();
  }

  function startChallenge(): void {
    const engine = getEngine();
    if (engine.getState().state !== "NOT_STARTED") return;

    engine.start();
    // Как и раньше: старт сразу открывает первую Reveal Region.
    engine.openNextReveal();
    publishSnapshot();
  }

  function submitGuess(guess: string): {
    isCorrect: boolean;
    isLost: boolean;
  } {
    const engine = getEngine();
    const trimmed = guess.trim();

    if (engine.getState().isFinished) {
      return { isCorrect: false, isLost: engine.getState().state === "LOST" };
    }

    if (engine.getState().state === "NOT_STARTED") engine.start();

    // Пустой ввод = открыть следующую подсказку, но не попытка.
    if (!trimmed) {
      engine.openNextReveal();
      publishSnapshot();
      return { isCorrect: false, isLost: false };
    }

    // Проверка ответа — только через Engine (GuessValidator внутри сессии).
    const { success: isCorrect } = engine.submitGuess(trimmed);
    const guessRecord: GameGuess = {
      value: trimmed,
      isCorrect,
      createdAt: new Date().toISOString(),
    };
    const nextGuesses = [...guesses, guessRecord];
    const wrongs = countWrongGuesses(nextGuesses);

    setGuesses(nextGuesses);

    if (isCorrect) {
      const current = engine.getState();
      const elapsed = getElapsedSeconds(current);
      const breakdown = calculateMovieScore({
        openedRegionCount: current.openedRegionCount,
        wrongGuessCount: wrongs,
        elapsedSeconds: elapsed,
        isFirstPlay: current.isFirstPlay,
      });

      engine.complete(breakdown.total);
      const completed = publishSnapshot();

      recordChallengeResult({
        challengeId: challenge.id,
        date: playDate,
        won: true,
        movieScore: breakdown.total,
        openedRegionCount: completed.openedRegionCount,
        wrongGuessCount: wrongs,
        elapsedSeconds: getElapsedSeconds(completed),
        source: playDate === getUtcDateString() ? "daily" : "archive",
      });

      return { isCorrect: true, isLost: false };
    }

    if (engine.isRevealComplete()) {
      engine.lose();
      const lost = publishSnapshot();

      recordChallengeResult({
        challengeId: challenge.id,
        date: playDate,
        won: false,
        movieScore: 0,
        openedRegionCount: lost.openedRegionCount,
        wrongGuessCount: wrongs,
        elapsedSeconds: getElapsedSeconds(lost),
        source: playDate === getUtcDateString() ? "daily" : "archive",
      });

      return { isCorrect: false, isLost: true };
    }

    // Неверно → следующая область.
    engine.openNextReveal();
    publishSnapshot();
    return { isCorrect: false, isLost: false };
  }

  function surrender(): void {
    const engine = getEngine();
    if (engine.getState().isFinished) return;
    if (!engine.isRevealComplete()) return;

    engine.lose();
    const lost = publishSnapshot();

    recordChallengeResult({
      challengeId: challenge.id,
      date: playDate,
      won: false,
      movieScore: 0,
      openedRegionCount: lost.openedRegionCount,
      wrongGuessCount: countWrongGuesses(guesses),
      elapsedSeconds: getElapsedSeconds(lost),
      source: playDate === getUtcDateString() ? "daily" : "archive",
    });
  }

  return {
    session,
    potentialScore,
    scoreBreakdown,
    visibleRegionCount,
    isFinished,
    canSurrender: !isFinished && session.isRevealComplete,
    openNextReveal,
    submitGuess,
    surrender,
    startChallenge,
  };
}
