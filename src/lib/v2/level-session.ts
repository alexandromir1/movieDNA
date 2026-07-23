import { GuessValidator } from "@/engine/guess/GuessValidator";
import type { Movie } from "@/types/content";
import type { V2Level, V2LevelResult } from "@/types/v2-content";

import {
  canRevealNext,
  createFragmentsRuntime,
  revealNext,
  type FragmentsRevealRuntime,
} from "./fragments-runtime";

/**
 * Минимальная Session одного Level (domain §6.7).
 * Эфемерна относительно Progress; не знает LevelSequence.
 */

export type V2SessionStatus = "active" | "won" | "lost";

export interface V2LevelSession {
  level: V2Level;
  movie: Movie;
  revealRuntime: FragmentsRevealRuntime;
  attemptCount: number;
  status: V2SessionStatus;
  lastGuessWrong: boolean;
}

export function createV2LevelSession(
  level: V2Level,
  movie: Movie,
): V2LevelSession {
  if (level.revealDefinition.kind !== "fragments") {
    throw new Error(
      `Unsupported reveal kind for slice: ${level.revealDefinition.kind}`,
    );
  }

  return {
    level,
    movie,
    revealRuntime: createFragmentsRuntime(level.revealDefinition),
    attemptCount: 0,
    status: "active",
    lastGuessWrong: false,
  };
}

export function sessionCanRevealNext(session: V2LevelSession): boolean {
  return (
    session.status === "active" && canRevealNext(session.revealRuntime)
  );
}

export function sessionRevealNext(session: V2LevelSession): V2LevelSession {
  if (!sessionCanRevealNext(session)) return session;
  return {
    ...session,
    revealRuntime: revealNext(session.revealRuntime),
    lastGuessWrong: false,
  };
}

export type SessionGuessOutcome =
  | { kind: "correct"; session: V2LevelSession; result: V2LevelResult }
  | { kind: "wrong"; session: V2LevelSession }
  | { kind: "ignored"; session: V2LevelSession };

export function sessionSubmitGuess(
  session: V2LevelSession,
  guess: string,
): SessionGuessOutcome {
  if (session.status !== "active") {
    return { kind: "ignored", session };
  }

  const trimmed = guess.trim();
  if (!trimmed) {
    return { kind: "ignored", session };
  }

  const validator = new GuessValidator(session.level.acceptedAnswers);
  const { success } = validator.validate(trimmed);
  const attemptCount = session.attemptCount + 1;

  if (!success) {
    return {
      kind: "wrong",
      session: {
        ...session,
        attemptCount,
        lastGuessWrong: true,
      },
    };
  }

  const won: V2LevelSession = {
    ...session,
    attemptCount,
    status: "won",
    lastGuessWrong: false,
  };

  const result: V2LevelResult = {
    levelId: session.level.id,
    movieId: session.movie.id,
    movieTitle: {
      ru: session.movie.title.ru,
      en: session.movie.title.en,
    },
    openedSteps: session.revealRuntime.openedSteps,
    totalSteps: session.revealRuntime.totalSteps,
    attemptCount,
    completedAt: new Date().toISOString(),
    outcome: "won",
  };

  return { kind: "correct", session: won, result };
}

/**
 * Открыть все шаги reveal (для сдачи / финального кадра).
 * Не трогает Progress — только runtime Session.
 */
export function sessionRevealAll(session: V2LevelSession): V2LevelSession {
  if (session.status !== "active") return session;
  return {
    ...session,
    lastGuessWrong: false,
    revealRuntime: {
      ...session.revealRuntime,
      openedSteps: session.revealRuntime.totalSteps,
    },
  };
}

export type SessionSurrenderOutcome = {
  session: V2LevelSession;
  result: V2LevelResult;
};

/** Сдача: все фрагменты открыты, Result с outcome=lost. Progress сдвигает app-слой. */
export function sessionSurrender(
  session: V2LevelSession,
): SessionSurrenderOutcome | null {
  if (session.status !== "active") return null;

  const revealed = sessionRevealAll(session);
  const closed: V2LevelSession = {
    ...revealed,
    status: "lost",
  };

  const result: V2LevelResult = {
    levelId: session.level.id,
    movieId: session.movie.id,
    movieTitle: {
      ru: session.movie.title.ru,
      en: session.movie.title.en,
    },
    openedSteps: revealed.revealRuntime.openedSteps,
    totalSteps: revealed.revealRuntime.totalSteps,
    attemptCount: session.attemptCount,
    completedAt: new Date().toISOString(),
    outcome: "lost",
  };

  return { session: closed, result };
}
