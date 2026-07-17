/**
 * Минимальный слой Engine Events.
 *
 * Это не полноценный Event Bus: только типизированный publish/subscribe,
 * который позже можно заменить без изменения публичного API Engine.
 * Engine не зависит от Analytics, React или внешних провайдеров.
 */

export type EngineEventName =
  | "challenge_started"
  | "challenge_completed"
  | "challenge_failed"
  | "challenge_give_up"
  | "reveal_opened"
  | "guess_submitted"
  | "guess_correct"
  | "guess_wrong";

export interface EngineEventMap {
  challenge_started: {
    challengeId: string;
  };

  challenge_completed: {
    challengeId: string;
    movieScore: number;
    openedRegionCount: number;
  };

  challenge_failed: {
    challengeId: string;
    openedRegionCount: number;
  };

  challenge_give_up: {
    challengeId: string;
    openedRegionCount: number;
  };

  reveal_opened: {
    challengeId: string;
    regionIndex: number;
    regionId: string;
  };

  guess_submitted: {
    challengeId: string;
    guessLength: number;
    attemptCount: number;
  };

  guess_correct: {
    challengeId: string;
    openedRegionCount: number;
    attemptCount: number;
  };

  guess_wrong: {
    challengeId: string;
    openedRegionCount: number;
    attemptCount: number;
  };
}

export interface EngineEventBase<E extends EngineEventName> {
  name: E;
  payload: EngineEventMap[E];
  createdAt: string;
}

export type EngineEvent = {
  [E in EngineEventName]: EngineEventBase<E>;
}[EngineEventName];

export type EngineEventHandler = (event: EngineEvent) => void;
