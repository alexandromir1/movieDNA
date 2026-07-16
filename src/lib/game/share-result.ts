import { siteConfig } from "@/config/site";
import { REVEAL_REGION_COUNT } from "@/config/economy";

import type { GameGuess, GameSession } from "@/types/content";

export function buildShareText(input: {
  movieTitle: string;
  movieScore: number;
  openedRegionCount: number;
  won: boolean;
}): string {
  const cells = Array.from({ length: REVEAL_REGION_COUNT }, (_, index) => {
    if (index < input.openedRegionCount) return "⬜";
    return "⬛";
  }).join("");

  const status = input.won
    ? `Movie Score ${input.movieScore}`
    : "Не завершено";

  return [
    `${siteConfig.name}`,
    cells,
    `${input.openedRegionCount}/${REVEAL_REGION_COUNT} Reveal`,
    status,
    siteConfig.url,
  ].join("\n");
}

export async function shareChallengeResult(input: {
  movieTitle: string;
  movieScore: number;
  openedRegionCount: number;
  won: boolean;
}): Promise<"shared" | "copied" | "failed"> {
  const text = buildShareText(input);

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ text, title: siteConfig.name });
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

export function countWrongGuesses(guesses: GameGuess[]): number {
  return guesses.filter((guess) => !guess.isCorrect).length;
}

export function getElapsedSeconds(session: GameSession, now = Date.now()): number {
  if (!session.startedAt) return 0;
  const end = session.completedAt
    ? new Date(session.completedAt).getTime()
    : now;
  return Math.max(
    0,
    Math.floor((end - new Date(session.startedAt).getTime()) / 1000),
  );
}
