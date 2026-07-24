import type {
  LevelSequence,
  V2LevelResult,
  V2PlayerProgress,
} from "@/types/v2-content";

import {
  advanceProgressAfterLevel,
  caseNumberForLevelId,
  completeDeferredLevel,
  currentLevelId,
  deferCurrentLevel,
  deferredIds,
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

export type PlayTarget =
  | {
      kind: "level";
      levelId: string;
      displayLevel: number;
      playKind: "campaign" | "deferred";
    }
  | { kind: "complete" };

export function resolvePlayTarget(
  progress: V2PlayerProgress,
  sequence: LevelSequence,
): PlayTarget {
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
    playKind: "campaign",
  };
}

export function resolveDeferredPlayTarget(
  progress: V2PlayerProgress,
  sequence: LevelSequence,
  levelId: string,
): PlayTarget | null {
  if (!deferredIds(progress).includes(levelId)) return null;
  if (!sequence.levelIds.includes(levelId)) return null;
  const displayLevel = caseNumberForLevelId(levelId, sequence);
  if (displayLevel == null) return null;
  return {
    kind: "level",
    levelId,
    displayLevel,
    playKind: "deferred",
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
  playKind: "campaign" | "deferred" = "campaign",
): V2PlayerProgress {
  if (playKind === "deferred") {
    return completeDeferredLevel(progress, result.levelId);
  }
  return advanceProgressAfterLevel(progress, result.levelId, sequence);
}

export function applyDeferToProgress(
  progress: V2PlayerProgress,
  sequence: LevelSequence,
): V2PlayerProgress | null {
  return deferCurrentLevel(progress, sequence);
}
