import type { V2LevelResult, V2PlayerProgress } from "@/types/v2-content";

import { getDefaultCampaign, getCampaignSequence } from "./campaigns";
import { applyResultToProgress, resolvePlayTarget } from "./engine";
import { displayLevelNumber, hasStartedProgress } from "./progress";
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
  | { cta: "play"; displayLevel: number }
  | { cta: "continue"; displayLevel: number };

export function getHomeEntry(): HomeEntry {
  const progress = readProgress();
  if (!hasStartedProgress(progress)) {
    return { cta: "play", displayLevel: 1 };
  }

  const sequence = activeSequence();
  const target = resolvePlayTarget(progress!, sequence);
  const displayLevel =
    target.kind === "level"
      ? target.displayLevel
      : Math.max(1, displayLevelNumber(progress!));

  return { cta: "continue", displayLevel };
}

export function beginOrResumePlay(): {
  progress: V2PlayerProgress;
  target: ReturnType<typeof resolvePlayTarget>;
} {
  const progress = ensureProgress();
  const sequence = activeSequence();
  return {
    progress,
    target: resolvePlayTarget(progress, sequence),
  };
}

/**
 * Победа на уровне: Engine сдвигает Progress, Result уходит в handoff.
 * Навигацию делает UI.
 */
export function commitLevelVictory(result: V2LevelResult): V2PlayerProgress {
  const progress = ensureProgress();
  const next = applyResultToProgress(progress, result, activeSequence());
  writeProgress(next);
  storeV2Result({ ...result, outcome: result.outcome ?? "won" });
  return next;
}

/**
 * Сдача: Progress сдвигается как после завершения дела,
 * Result с outcome=lost для экрана ответа.
 */
export function commitLevelSurrender(result: V2LevelResult): V2PlayerProgress {
  const progress = ensureProgress();
  const next = applyResultToProgress(progress, result, activeSequence());
  writeProgress(next);
  storeV2Result({ ...result, outcome: "lost" });
  return next;
}
