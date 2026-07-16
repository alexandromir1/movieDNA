/** Публичный API модуля challenge (State Machine). */

export { ChallengeSession } from "./ChallengeSession";
export { assertTransition, canTransition } from "./state";

export type {
  ChallengeSessionConfig,
  ChallengeSessionSnapshot,
  ChallengeState,
} from "./types";
