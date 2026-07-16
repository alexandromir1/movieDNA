/**
 * Типы Challenge Session (Engine FSM).
 *
 * Состояния MVP — только то, что нужно сейчас.
 * Не добавлять будущие состояния до появления реальной механики.
 */

import type { RevealRegionDefinition } from "@/engine/reveal";

export type ChallengeState =
  | "NOT_STARTED"
  | "WAITING_FOR_GUESS"
  | "REVEALING"
  | "COMPLETED"
  | "LOST";

/** Снимок состояния сессии — то, что читает UI / будущие клиенты. */
export interface ChallengeSessionSnapshot {
  challengeId: string;
  state: ChallengeState;
  /** Сколько Reveal Regions открыто — источник: RevealManager. */
  openedRegionCount: number;
  /** Открытые Reveal Regions в порядке открытия. */
  openedRegions: RevealRegionDefinition[];
  /** Число отправленных попыток угадывания. */
  attemptCount: number;
  /** Сессия завершена (state === COMPLETED). */
  isFinished: boolean;
  /** Все Reveal Regions открыты. */
  isRevealComplete: boolean;
  startedAt: string | null;
  completedAt: string | null;
  /** Итоговый Movie Score после complete(); до этого null. */
  movieScore: number | null;
  isFirstPlay: boolean;
}

export interface ChallengeSessionConfig {
  challengeId: string;
  isFirstPlay?: boolean;
  /** Регионы уровня — загружаются в RevealManager при создании сессии. */
  regions?: RevealRegionDefinition[];
  /** Полные официальные названия (RU/EN) — загружаются в GuessValidator. */
  acceptedAnswers?: string[];
  /**
   * Начальное состояние для временной совместимости со старым Storage.
   * Storage Adapter будет вынесен отдельным PR.
   */
  initialState?: Partial<
    Pick<
      ChallengeSessionSnapshot,
      | "state"
      | "openedRegionCount"
      | "attemptCount"
      | "startedAt"
      | "completedAt"
      | "movieScore"
    >
  >;
}
