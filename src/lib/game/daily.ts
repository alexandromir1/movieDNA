import { siteConfig } from "@/config/site";

import type { CatalogMovie } from "./movie-catalog";

const MS_PER_DAY = 86_400_000;

/** UTC-дата в формате YYYY-MM-DD */
export function getUtcDateString(date: Date = new Date()): string {
  return date.toISOString().split("T")[0];
}

/** Число UTC-дней с эпохи — детерминированный сид для Daily */
export function utcDateSeed(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / MS_PER_DAY);
}

/** Смещение UTC-даты на N дней */
export function addUtcDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().split("T")[0];
}

export function isValidDailyDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;

  const today = getUtcDateString();
  return date >= siteConfig.dailyLaunchDate && date <= today;
}

/** Номер Daily-игры (1-based) от даты запуска */
export function getPuzzleNumber(date: string): number {
  const launchSeed = utcDateSeed(siteConfig.dailyLaunchDate);
  const dateSeed = utcDateSeed(date);
  return dateSeed - launchSeed + 1;
}

/**
 * Выбрать фильм для даты: сид = UTC-дата, при коллизии — следующий в каталоге.
 * @param usedMovieIds фильмы, уже назначенные на предыдущие дни
 */
export function selectDailyMovieId(
  date: string,
  catalog: CatalogMovie[],
  usedMovieIds: Set<string>,
): string {
  if (catalog.length === 0) {
    throw new Error("Movie catalog is empty");
  }

  const startIndex = utcDateSeed(date) % catalog.length;

  for (let offset = 0; offset < catalog.length; offset++) {
    const movie = catalog[(startIndex + offset) % catalog.length];
    if (!usedMovieIds.has(movie.id)) {
      return movie.id;
    }
  }

  // Все фильмы уже использованы — начинаем новый цикл с сида
  return catalog[startIndex].id;
}

/** Симуляция истории: какие фильмы были назначены до указанной даты */
export function getUsedMovieIdsBeforeDate(
  date: string,
  catalog: CatalogMovie[],
  launchDate: string = siteConfig.dailyLaunchDate,
): Set<string> {
  const used = new Set<string>();
  let current = launchDate;

  while (current < date) {
    const movieId = selectDailyMovieId(current, catalog, used);
    used.add(movieId);
    current = addUtcDays(current, 1);
  }

  return used;
}

/** Список UTC-дат от запуска до сегодня включительно (desc) */
export function getDailyDateRange(
  launchDate: string = siteConfig.dailyLaunchDate,
  endDate: string = getUtcDateString(),
): string[] {
  const dates: string[] = [];
  let current = endDate;

  while (current >= launchDate) {
    dates.push(current);
    current = addUtcDays(current, -1);
  }

  return dates;
}
