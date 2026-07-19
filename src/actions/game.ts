"use server";

import {
  getArchiveChallenges,
  getChallengeBundleByDate,
  getTodayChallengeBundle,
} from "@/lib/content/catalog";
import { getUtcDateString } from "@/lib/game/daily";
import type { LocalizedString } from "@/lib/i18n/types";

export async function getTodayPuzzle() {
  return getTodayChallengeBundle();
}

export async function getPuzzleByDate(date: string) {
  return getChallengeBundleByDate(date);
}

/**
 * Список архива для игрока.
 * Метаданные фильма нужны для истории пройденных Challenge;
 * UI не показывает название/кадр до завершения (анти-спойлер).
 */
export async function getArchiveList(): Promise<
  Array<{
    date: string;
    challengeId: string;
    title: LocalizedString;
    year: number;
    image: string;
  }>
> {
  return getArchiveChallenges()
    .map((challenge) => {
      const bundle = getChallengeBundleByDate(challenge.date);
      if (!bundle) return null;
      return {
        date: challenge.date,
        challengeId: challenge.id,
        title: bundle.movie.title,
        year: bundle.movie.year,
        image: bundle.level.image,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
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
