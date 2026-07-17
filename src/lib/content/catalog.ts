import {
  loadAllChallenges,
  loadAllLevels,
  loadAllMovies,
} from "@/lib/content/load-fs";
import { getChallengeScheduleBucket } from "@/lib/content/schedule";
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

/**
 * Каталог для автодополнения: ~500 фильмов (RU + EN) + playable movies.
 */
export function getMovieSearchCatalog(): Array<{
  id: string;
  title: string;
  titleOriginal: string | null;
  year: number;
}> {
  const byKey = new Map<
    string,
    { id: string; title: string; titleOriginal: string | null; year: number }
  >();

  for (const movie of searchCatalog as Array<{
    id: string;
    title: string;
    titleOriginal: string | null;
    year: number;
  }>) {
    const key = `${movie.titleOriginal ?? movie.title}|${movie.year}`.toLowerCase();
    byKey.set(key, {
      id: movie.id,
      title: movie.title,
      titleOriginal: movie.titleOriginal,
      year: movie.year,
    });
  }

  for (const movie of movies()) {
    if (!movie.title.trim() && !movie.titleOriginal?.trim()) continue;
    const entry = {
      id: movie.id,
      title: movie.title || movie.titleOriginal || movie.id,
      titleOriginal: movie.titleOriginal,
      year: movie.year,
    };
    const key = `${entry.titleOriginal ?? entry.title}|${entry.year}`.toLowerCase();
    byKey.set(key, entry);
  }

  return Array.from(byKey.values());
}
