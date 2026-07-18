import { siteConfig } from "@/config/site";
import { REVEAL_REGION_COUNT } from "@/config/economy";

import type { GameGuess, GameSession } from "@/types/content";

function hintNoun(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return "подсказка";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return "подсказки";
  }
  return "подсказок";
}

/** Человеческая строка про подсказки — без слова Reveal. */
export function formatHintsShareLine(openedRegionCount: number): string {
  const count = Math.max(0, openedRegionCount);
  if (count <= 1) return "Угадал с первой подсказки";
  if (count >= REVEAL_REGION_COUNT) return "Понадобились все подсказки";
  return `Понадобилось ${count} ${hintNoun(count)}`;
}

/**
 * Ссылка в шаринге только в production.
 * Локально (localhost / 127.0.0.1) — не добавляем.
 */
export function getShareLink(): string | null {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") return null;
  }

  try {
    const parsed = new URL(siteConfig.url);
    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
      return null;
    }
    return parsed.origin;
  } catch {
    return null;
  }
}

export function buildShareText(input: {
  movieTitle: string;
  movieScore: number;
  openedRegionCount: number;
  elapsedSeconds?: number;
  won: boolean;
}): string {
  const link = getShareLink();

  // Без названия фильма — иначе получатель шаринга уже знает ответ.
  if (!input.won) {
    return [
      `${siteConfig.name}`,
      "Не угадал Challenge",
      loseHintsLine(input.openedRegionCount),
      "Сможешь лучше?",
      link,
    ]
      .filter((line): line is string => Boolean(line))
      .join("\n");
  }

  return [
    `${siteConfig.name}`,
    `Movie Score ${input.movieScore}`,
    formatHintsShareLine(input.openedRegionCount),
    "Попробуй сегодняшний Challenge",
    link,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");
}

function loseHintsLine(openedRegionCount: number): string {
  const count = Math.max(0, openedRegionCount);
  if (count <= 0) return "Так и не открыл подсказки";
  if (count >= REVEAL_REGION_COUNT) return "Открыл все подсказки";
  return `Открыл ${count} ${hintNoun(count)}`;
}

/** Можно ли предложить share/copy (не показывать мёртвую кнопку). */
export function canOfferShare(): boolean {
  if (typeof navigator === "undefined") return false;
  const hasShare = typeof navigator.share === "function";
  const hasClipboard =
    typeof navigator.clipboard?.writeText === "function" ||
    typeof document !== "undefined";
  return hasShare || hasClipboard;
}

export async function shareChallengeResult(input: {
  movieTitle: string;
  movieScore: number;
  openedRegionCount: number;
  elapsedSeconds?: number;
  won: boolean;
}): Promise<"shared" | "copied" | "cancelled" | "failed"> {
  const text = buildShareText(input);

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ text, title: siteConfig.name });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return "cancelled";
      }
      // fall through to clipboard
    }
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return "copied";
    }
  } catch {
    // fall through
  }

  // Legacy textarea copy
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.left = "-9999px";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    if (ok) return "copied";
  } catch {
    // ignore
  }

  return "failed";
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
