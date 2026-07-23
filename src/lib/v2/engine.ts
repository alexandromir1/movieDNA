import type {
  LevelSequence,
  V2LevelResult,
  V2PlayerProgress,
} from "@/types/v2-content";

import {
  advanceProgressAfterLevel,
  currentLevelId,
  displayLevelNumber,
  isSequenceComplete,
} from "./progress";

/**
 * Тонкий координатор v2 (docs/v2-domain-model.md §7 / §7.1).
 * Не React, не DOM, не analytics vendor, не роутер.
 * Не знает id кампании — только LevelSequence, которую передаёт application.
 *
 * Result → Progress только через эти функции (Result сам Progress не трогает).
 */

export function resolvePlayTarget(
  progress: V2PlayerProgress,
  sequence: LevelSequence,
):
  | { kind: "level"; levelId: string; displayLevel: number }
  | { kind: "complete" } {
  if (isSequenceComplete(progress, sequence)) {
    return { kind: "complete" };
  }

  const levelId = currentLevelId(progress, sequence);
  if (!levelId) {
    return { kind: "complete" };
  }

  return {
    kind: "level",
    levelId,
    displayLevel: displayLevelNumber(progress),
  };
}

/**
 * После успешной Session: применить Result к Progress.
 * Вызывать из application-слоя сразу после Session → Result.
 */
export function applyResultToProgress(
  progress: V2PlayerProgress,
  result: V2LevelResult,
  sequence: LevelSequence,
): V2PlayerProgress {
  return advanceProgressAfterLevel(progress, result.levelId, sequence);
}
