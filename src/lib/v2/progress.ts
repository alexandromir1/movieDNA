import type { LevelSequence, V2PlayerProgress } from "@/types/v2-content";

/** Чистые операции Progress — без storage и без UI. */

export function createInitialProgress(): V2PlayerProgress {
  return { currentSequenceIndex: 0 };
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

/**
 * Сдвиг после завершённого Level.
 * Result сам Progress не меняет — вызывающий (Engine) применяет сдвиг.
 */
export function advanceProgressAfterLevel(
  progress: V2PlayerProgress,
  completedLevelId: string,
  sequence: LevelSequence,
): V2PlayerProgress {
  const expected = currentLevelId(progress, sequence);
  if (expected !== completedLevelId) {
    return progress;
  }

  return {
    currentSequenceIndex: Math.min(
      progress.currentSequenceIndex + 1,
      sequence.levelIds.length,
    ),
  };
}

/** Есть ли сохранённый прогресс (для CTA Играть / Продолжить). */
export function hasStartedProgress(progress: V2PlayerProgress | null): boolean {
  return progress != null;
}
