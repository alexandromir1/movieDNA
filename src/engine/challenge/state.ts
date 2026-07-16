import type { ChallengeState } from "./types";

/**
 * Таблица допустимых переходов Challenge FSM.
 *
 * Источник истины для State Machine. Методы ChallengeSession
 * опираются на эту карту и не добавляют скрытых переходов.
 */

const ALLOWED_TRANSITIONS: Record<ChallengeState, readonly ChallengeState[]> = {
  NOT_STARTED: ["WAITING_FOR_GUESS"],
  WAITING_FOR_GUESS: ["REVEALING", "COMPLETED", "LOST"],
  REVEALING: ["WAITING_FOR_GUESS", "COMPLETED", "LOST"],
  COMPLETED: [],
  LOST: [],
};

export function canTransition(
  from: ChallengeState,
  to: ChallengeState,
): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function assertTransition(
  from: ChallengeState,
  to: ChallengeState,
): void {
  if (!canTransition(from, to)) {
    throw new Error(
      `ChallengeSession: недопустимый переход ${from} → ${to}`,
    );
  }
}
