import type { V2LevelResult, V2PlayerProgress } from "@/types/v2-content";

import {
  clearActivePlay,
  readActivePlay,
  writeActivePlay,
} from "./active-play";
import { getDefaultCampaign, getCampaignSequence } from "./campaigns";
import {
  applyDeferToProgress,
  applyResultToProgress,
  resolveDeferredPlayTarget,
  resolvePlayTarget,
  type PlayTarget,
} from "./engine";
import {
  closedCaseCount,
  displayLevelNumber,
  hasDeferredCases,
  hasStartedProgress,
} from "./progress";
import { ensureProgress, readProgress, writeProgress } from "./progress-store";
import { storeV2Result } from "./result-handoff";

/**
 * Application-слой v2: UI вызывает только эти команды.
 * Выбор Campaign → sequence; Engine работает с sequence, не с campaign id.
 */

function activeSequence() {
  return getCampaignSequence(getDefaultCampaign());
}

export type HomeEntry =
  | { cta: "play"; displayLevel: number; closedCount: number }
  | { cta: "continue"; displayLevel: number; closedCount: number };

export function getHomeEntry(): HomeEntry {
  const progress = readProgress();
  if (!hasStartedProgress(progress)) {
    return { cta: "play", displayLevel: 1, closedCount: 0 };
  }

  const sequence = activeSequence();
  const target = resolvePlayTarget(progress!, sequence);
  const displayLevel =
    target.kind === "level"
      ? target.displayLevel
      : Math.max(1, displayLevelNumber(progress!));

  return {
    cta: "continue",
    displayLevel,
    closedCount: closedCaseCount(progress!),
  };
}

export function beginOrResumePlay(): {
  progress: V2PlayerProgress;
  target: PlayTarget;
} {
  const progress = ensureProgress();
  const sequence = activeSequence();
  const active = readActivePlay();

  if (active.kind === "deferred") {
    const deferredTarget = resolveDeferredPlayTarget(
      progress,
      sequence,
      active.levelId,
    );
    if (deferredTarget) {
      return { progress, target: deferredTarget };
    }
    clearActivePlay();
  }

  return {
    progress,
    target: resolvePlayTarget(progress, sequence),
  };
}

/** Открыть отложенное дело со стола архива. */
export function beginDeferredPlay(levelId: string): boolean {
  const progress = ensureProgress();
  const sequence = activeSequence();
  const target = resolveDeferredPlayTarget(progress, sequence, levelId);
  if (!target || target.kind !== "level") return false;
  writeActivePlay({ kind: "deferred", levelId });
  return true;
}

/** Первое отложенное — для CTA после кампании. */
export function beginFirstDeferredPlay(): boolean {
  const progress = ensureProgress();
  const first = progress.deferredLevelIds?.[0];
  if (!first) return false;
  return beginDeferredPlay(first);
}

export function getDeferredCount(): number {
  const progress = readProgress();
  if (!progress) return 0;
  return progress.deferredLevelIds?.length ?? 0;
}

export function campaignHasDeferred(): boolean {
  const progress = readProgress();
  return progress != null && hasDeferredCases(progress);
}

/**
 * Победа на уровне: Engine сдвигает Progress, Result уходит в handoff.
 * Навигацию делает UI.
 */
export function commitLevelVictory(
  result: V2LevelResult,
  playKind: "campaign" | "deferred" = "campaign",
): V2PlayerProgress {
  const progress = ensureProgress();
  const next = applyResultToProgress(
    progress,
    result,
    activeSequence(),
    playKind,
  );
  writeProgress(next);
  storeV2Result({ ...result, outcome: result.outcome ?? "won" });
  if (playKind === "deferred") {
    clearActivePlay();
  }
  return next;
}

/**
 * Сдача: Progress сдвигается как после завершения дела,
 * Result с outcome=lost для экрана ответа.
 */
export function commitLevelSurrender(
  result: V2LevelResult,
  playKind: "campaign" | "deferred" = "campaign",
): V2PlayerProgress {
  const progress = ensureProgress();
  const next = applyResultToProgress(
    progress,
    result,
    activeSequence(),
    playKind,
  );
  writeProgress(next);
  storeV2Result({ ...result, outcome: "lost" });
  if (playKind === "deferred") {
    clearActivePlay();
  }
  return next;
}

/**
 * Отложить текущее дело основной кампании.
 * Прогресс идёт дальше; дело попадает в «Нераскрытые».
 */
export function deferCurrentCase(): V2PlayerProgress | null {
  const progress = ensureProgress();
  const active = readActivePlay();
  if (active.kind === "deferred") return null;

  const next = applyDeferToProgress(progress, activeSequence());
  if (!next) return null;
  writeProgress(next);
  clearActivePlay();
  return next;
}
