import {
  loadAllChallenges,
  loadAllLevels,
  loadAllMovies,
} from "@/lib/content/load-fs";
import { getChallengeScheduleBucket } from "@/lib/content/schedule";
import { localize } from "@/lib/i18n/localize";
import { DEFAULT_LOCALE, type Locale, type LocalizedString } from "@/lib/i18n/types";
import { getUtcDateString } from "@/lib/game/daily";
import searchCatalog from "../../../data/movies/search-catalog.json";

import type { Challenge, Level, Movie } from "@/types/content";

export interface ChallengeBundle {
  challenge: Challenge;
  level: Level;
  movie: Movie;
}

/** @deprecated используй ChallengeBundle */
export type PublishedChallengeBundle = ChallengeBundle;

export interface SearchCatalogEntry {
  id: string;
  title: LocalizedString;
  year: number;
}

function movies(): Movie[] {
  return loadAllMovies();
}

function levels(): Level[] {
  return loadAllLevels();
}

function challenges(): Challenge[] {
  return loadAllChallenges();
}

export function getMovieById(id: string): Movie | null {
  return movies().find((movie) => movie.id === id) ?? null;
}

export function getLevelById(id: string): Level | null {
  return levels().find((level) => level.id === id) ?? null;
}

export function getChallengeById(id: string): Challenge | null {
  return challenges().find((challenge) => challenge.id === id) ?? null;
}

/** Archive links for Related / Random CTAs (date + id only, no titles). */
export function getArchiveChallengeLinks(
  today: string = getUtcDateString(),
): Array<{ challengeId: string; date: string }> {
  return getArchiveChallenges(today).map((challenge) => ({
    challengeId: challenge.id,
    date: challenge.date,
  }));
}

export function resolveRelatedChallengeLinks(
  relatedIds: string[] | undefined,
  today: string = getUtcDateString(),
): Array<{ challengeId: string; date: string }> {
  if (!relatedIds?.length) return [];
  const links: Array<{ challengeId: string; date: string }> = [];
  for (const id of relatedIds) {
    const challenge = getChallengeById(id);
    if (!challenge) continue;
    if (challenge.status !== "scheduled") continue;
    if (challenge.date >= today) continue;
    links.push({ challengeId: challenge.id, date: challenge.date });
  }
  return links;
}

function toBundle(challenge: Challenge): ChallengeBundle | null {
  const level = getLevelById(challenge.levelId);
  if (!level) return null;
  const movie = getMovieById(level.movieId);
  if (!movie) return null;
  return { challenge, level, movie };
}

/** Все scheduled Challenge (дата = publishAt). */
export function getScheduledChallenges(): Challenge[] {
  return challenges()
    .filter((challenge) => challenge.status === "scheduled")
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getUpcomingChallenges(
  today: string = getUtcDateString(),
): Challenge[] {
  return getScheduledChallenges().filter(
    (challenge) => getChallengeScheduleBucket(challenge, today) === "upcoming",
  );
}

export function getArchiveChallenges(
  today: string = getUtcDateString(),
): Challenge[] {
  return getScheduledChallenges()
    .filter(
      (challenge) => getChallengeScheduleBucket(challenge, today) === "archive",
    )
    .sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Today's Challenge: status=scheduled и date == today (UTC).
 * Без fallback на «первый попавшийся» — дата единственный источник правды.
 */
export function getTodayChallengeBundle(
  today: string = getUtcDateString(),
): ChallengeBundle | null {
  const challenge = getScheduledChallenges().find(
    (item) => getChallengeScheduleBucket(item, today) === "today",
  );
  return challenge ? toBundle(challenge) : null;
}

/**
 * Challenge на конкретную дату.
 * Доступен, если scheduled и date <= today (today или archive).
 */
export function getChallengeBundleByDate(
  date: string,
  today: string = getUtcDateString(),
): ChallengeBundle | null {
  const challenge = getScheduledChallenges().find((item) => item.date === date);
  if (!challenge) return null;

  const bucket = getChallengeScheduleBucket(challenge, today);
  if (bucket !== "today" && bucket !== "archive") return null;

  return toBundle(challenge);
}

/** @deprecated используй getScheduledChallenges / getTodayChallengeBundle */
export function getPublishedChallenges(): Challenge[] {
  return getScheduledChallenges();
}

function filmKey(title: LocalizedString, year: number): string {
  return `${localize(title, "en").toLowerCase()}|${year}`;
}

function filmNameEn(title: LocalizedString): string {
  return localize(title, "en").toLowerCase().trim();
}

/**
 * Каталог для автодополнения: search-catalog + playable.
 * Playable побеждает IMDb-клоны / год ±2.
 */
export function getMovieSearchCatalog(): SearchCatalogEntry[] {
  const byKey = new Map<string, SearchCatalogEntry>();
  const isImdbCatalogId = (id: string) => /^movie-tt\d+/i.test(id);

  for (const movie of searchCatalog as SearchCatalogEntry[]) {
    byKey.set(filmKey(movie.title, movie.year), {
      id: movie.id,
      title: movie.title,
      year: movie.year,
    });
  }

  for (const movie of movies()) {
    const title = movie.title;
    if (!localize(title, DEFAULT_LOCALE).trim()) continue;
    const entry: SearchCatalogEntry = {
      id: movie.id,
      title,
      year: movie.year,
    };

    for (const [key, existing] of [...byKey.entries()]) {
      if (filmNameEn(existing.title) !== filmNameEn(entry.title)) continue;
      const yearClose = Math.abs(existing.year - entry.year) <= 2;
      if (yearClose || isImdbCatalogId(existing.id)) {
        byKey.delete(key);
      }
    }

    byKey.set(filmKey(entry.title, entry.year), entry);
  }

  return Array.from(byKey.values());
}

/** Подпись для UI поиска в выбранной локали. */
export function formatSearchLabel(
  entry: SearchCatalogEntry,
  locale: Locale,
): string {
  return `${localize(entry.title, locale)} (${entry.year})`;
}
