import type { LevelSequence, V2PlayerProgress } from "@/types/v2-content";

/** Чистые операции Progress — без storage и без UI. */

export function normalizeProgress(
  progress: V2PlayerProgress,
): Required<Pick<V2PlayerProgress, "currentSequenceIndex" | "deferredLevelIds">> &
  V2PlayerProgress {
  return {
    ...progress,
    deferredLevelIds: [...(progress.deferredLevelIds ?? [])],
  };
}

export function createInitialProgress(): V2PlayerProgress {
  return { currentSequenceIndex: 0, deferredLevelIds: [] };
}

export function deferredIds(progress: V2PlayerProgress): string[] {
  return progress.deferredLevelIds ?? [];
}

export function displayLevelNumber(progress: V2PlayerProgress): number {
  return progress.currentSequenceIndex + 1;
}

export function isSequenceComplete(
  progress: V2PlayerProgress,
  sequence: LevelSequence,
): boolean {
  return progress.currentSequenceIndex >= sequence.levelIds.length;
}

export function currentLevelId(
  progress: V2PlayerProgress,
  sequence: LevelSequence,
): string | null {
  if (isSequenceComplete(progress, sequence)) return null;
  return sequence.levelIds[progress.currentSequenceIndex] ?? null;
}

export function caseNumberForLevelId(
  levelId: string,
  sequence: LevelSequence,
): number | null {
  const index = sequence.levelIds.indexOf(levelId);
  return index >= 0 ? index + 1 : null;
}

/** Закрытые = пройденные по индексу минус отложенные. */
export function closedCaseCount(progress: V2PlayerProgress): number {
  return Math.max(0, progress.currentSequenceIndex - deferredIds(progress).length);
}

export function hasDeferredCases(progress: V2PlayerProgress): boolean {
  return deferredIds(progress).length > 0;
}

/**
 * Сдвиг после завершённого Level основной очереди.
 * Result сам Progress не меняет — вызывающий (Engine) применяет сдвиг.
 */
export function advanceProgressAfterLevel(
  progress: V2PlayerProgress,
  completedLevelId: string,
  sequence: LevelSequence,
): V2PlayerProgress {
  const base = normalizeProgress(progress);
  const expected = currentLevelId(base, sequence);
  if (expected !== completedLevelId) {
    return base;
  }

  return {
    currentSequenceIndex: Math.min(
      base.currentSequenceIndex + 1,
      sequence.levelIds.length,
    ),
    deferredLevelIds: base.deferredLevelIds.filter(
      (id) => id !== completedLevelId,
    ),
  };
}

/**
 * Отложить текущее дело основной очереди и сдвинуть Progress дальше.
 */
export function deferCurrentLevel(
  progress: V2PlayerProgress,
  sequence: LevelSequence,
): V2PlayerProgress | null {
  const base = normalizeProgress(progress);
  const levelId = currentLevelId(base, sequence);
  if (!levelId) return null;
  if (base.deferredLevelIds.includes(levelId)) return null;

  return {
    currentSequenceIndex: Math.min(
      base.currentSequenceIndex + 1,
      sequence.levelIds.length,
    ),
    deferredLevelIds: [...base.deferredLevelIds, levelId],
  };
}

/** Закрыть отложенное дело (победа или сдача) — убрать из списка. */
export function completeDeferredLevel(
  progress: V2PlayerProgress,
  levelId: string,
): V2PlayerProgress {
  const base = normalizeProgress(progress);
  return {
    ...base,
    deferredLevelIds: base.deferredLevelIds.filter((id) => id !== levelId),
  };
}

/** Есть ли сохранённый прогресс (для CTA Играть / Продолжить). */
export function hasStartedProgress(progress: V2PlayerProgress | null): boolean {
  return progress != null;
}
