/**
 * Эфемерный выбор «какое дело сейчас на столе».
 * Не Progress: только UI → app handoff между Архивом и Game.
 */
export const V2_ACTIVE_PLAY_KEY = "moviedna-v2-active-play";

export type V2ActivePlay =
  | { kind: "campaign" }
  | { kind: "deferred"; levelId: string };

export function readActivePlay(): V2ActivePlay {
  if (typeof window === "undefined") return { kind: "campaign" };
  try {
    const raw = sessionStorage.getItem(V2_ACTIVE_PLAY_KEY);
    if (!raw) return { kind: "campaign" };
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      (parsed as { kind?: string }).kind === "deferred" &&
      typeof (parsed as { levelId?: unknown }).levelId === "string"
    ) {
      return {
        kind: "deferred",
        levelId: (parsed as { levelId: string }).levelId,
      };
    }
  } catch {
    // ignore
  }
  return { kind: "campaign" };
}

export function writeActivePlay(play: V2ActivePlay): void {
  if (typeof window === "undefined") return;
  try {
    if (play.kind === "campaign") {
      sessionStorage.removeItem(V2_ACTIVE_PLAY_KEY);
      return;
    }
    sessionStorage.setItem(V2_ACTIVE_PLAY_KEY, JSON.stringify(play));
  } catch {
    // ignore
  }
}

export function clearActivePlay(): void {
  writeActivePlay({ kind: "campaign" });
}
