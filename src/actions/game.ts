"use server";

import {
  getChallengeBundleByDate,
  getTodayChallengeBundle,
} from "@/lib/content/catalog";

export async function getTodayPuzzle() {
  return getTodayChallengeBundle();
}

export async function getPuzzleByDate(date: string) {
  return getChallengeBundleByDate(date);
}

export async function getArchiveList(): Promise<
  Array<{ date: string; status: string }>
> {
  const today = getTodayChallengeBundle();
  if (!today) return [];
  return [{ date: today.challenge.date, status: "unplayed" }];
}
