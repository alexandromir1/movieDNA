"use server";

import {
  getArchiveChallenges,
  getChallengeBundleByDate,
  getTodayChallengeBundle,
} from "@/lib/content/catalog";

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
