import { REVEAL_REGION_COUNT } from "@/config/economy";
import { siteConfig } from "@/config/site";

import { getPuzzleNumber } from "@/lib/game/utils";

import type { GameAttempt } from "@/types/game";

const EMOJI = {
  win: "🟩",
  wrong: "🟥",
  skip: "⬜",
} as const;

export function buildEmojiGrid(attempts: GameAttempt[]): string {
  if (attempts.length === 0) return EMOJI.wrong.repeat(REVEAL_REGION_COUNT);

  return attempts
    .map((attempt) => {
      if (attempt.isCorrect) return EMOJI.win;
      if (attempt.skipped) return EMOJI.skip;
      return EMOJI.wrong;
    })
    .join("");
}

export function buildShareText(
  date: string,
  attempts: GameAttempt[],
  won: boolean,
): string {
  const puzzleNumber = getPuzzleNumber(date);
  const grid = buildEmojiGrid(attempts);
  const statusLine = won
    ? `Угадано за ${attempts.length} ${attempts.length === 1 ? "попытку" : attempts.length < 5 ? "попытки" : "попыток"} 🎬`
    : "Не угадано ✗";

  return [
    `Киношка #${puzzleNumber}`,
    grid,
    statusLine,
    siteConfig.url,
  ].join("\n");
}

export async function shareGameResult(
  date: string,
  attempts: GameAttempt[],
  won: boolean,
): Promise<"shared" | "copied" | "failed"> {
  const text = buildShareText(date, attempts, won);

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ text, title: "Киношка" });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return "failed";
      }
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}
