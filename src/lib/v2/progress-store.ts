import type { V2PlayerProgress } from "@/types/v2-content";

import { createInitialProgress } from "./progress";

/** Локальное хранилище Player.Progress (без облака / аккаунтов). */
export const V2_PROGRESS_STORAGE_KEY = "moviedna-v2-progress";

function isProgress(value: unknown): value is V2PlayerProgress {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.currentSequenceIndex === "number" &&
    Number.isFinite(record.currentSequenceIndex) &&
    record.currentSequenceIndex >= 0
  );
}

export function readProgress(): V2PlayerProgress | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(V2_PROGRESS_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isProgress(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeProgress(progress: V2PlayerProgress): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(V2_PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // private mode / quota
  }
}

/** Прочитать или создать начальный Progress и сохранить. */
export function ensureProgress(): V2PlayerProgress {
  const existing = readProgress();
  if (existing) return existing;
  const created = createInitialProgress();
  writeProgress(created);
  return created;
}
