import type { V2LevelResult } from "@/types/v2-content";

/** Handoff Session Result → экран /v2/result (не Progress). */
export const V2_RESULT_STORAGE_KEY = "moviedna-v2-last-result";

export function storeV2Result(result: V2LevelResult): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(V2_RESULT_STORAGE_KEY, JSON.stringify(result));
  } catch {
    // private mode / quota — экран результата покажет fallback
  }
}

export function readV2Result(): V2LevelResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(V2_RESULT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as V2LevelResult;
  } catch {
    return null;
  }
}
