"use server";

import {
  getArchiveChallenges,
  getChallengeBundleByDate,
  getTodayChallengeBundle,
} from "@/lib/content/catalog";
import { getUtcDateString } from "@/lib/game/daily";

export async function getTodayPuzzle() {
  return getTodayChallengeBundle();
}

export async function getPuzzleByDate(date: string) {
  return getChallengeBundleByDate(date);
}

/** Список архива для игрока — без названий фильмов (анти-спойлер). */
export async function getArchiveList(): Promise<
  Array<{ date: string; challengeId: string }>
> {
  return getArchiveChallenges().map((challenge) => ({
    date: challenge.date,
    challengeId: challenge.id,
  }));
}

/**
 * Навигация сайдбара: Today (если есть) + Archive, новые сверху.
 * Без названий фильмов.
 */
export async function getChallengeNavItems(): Promise<
  Array<{ date: string; challengeId: string; isToday: boolean }>
> {
  const today = getUtcDateString();
  const todayBundle = getTodayChallengeBundle(today);
  const archive = getArchiveChallenges(today);

  const items: Array<{ date: string; challengeId: string; isToday: boolean }> =
    [];

  if (todayBundle) {
    items.push({
      date: todayBundle.challenge.date,
      challengeId: todayBundle.challenge.id,
      isToday: true,
    });
  }

  for (const challenge of archive) {
    items.push({
      date: challenge.date,
      challengeId: challenge.id,
      isToday: false,
    });
  }

  return items;
}
