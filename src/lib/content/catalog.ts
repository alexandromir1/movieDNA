import type { Challenge, Level, Movie } from "@/types/content";

import challengeTerminator2 from "../../../data/challenges/terminator-2.json";
import levelTerminator2 from "../../../data/levels/terminator-2.json";
import movieTerminator2 from "../../../data/movies/terminator-2.json";
import searchCatalog from "../../../data/movies/search-catalog.json";

const movies: Movie[] = [movieTerminator2 as Movie];
const levels: Level[] = [levelTerminator2 as Level];
const challenges: Challenge[] = [challengeTerminator2 as Challenge];

/** Статический каталог подсказок (IMDb top + популярные), RU + EN */
const movieSearchCatalog: Array<{
  id: string;
  title: string;
  titleOriginal: string | null;
  year: number;
}> = (searchCatalog as Array<{
  id: string;
  title: string;
  titleOriginal: string | null;
  year: number;
}>).map((movie) => ({
  id: movie.id,
  title: movie.title,
  titleOriginal: movie.titleOriginal,
  year: movie.year,
}));

export interface PublishedChallengeBundle {
  challenge: Challenge;
  level: Level;
  movie: Movie;
}

export function getMovieById(id: string): Movie | null {
  return movies.find((movie) => movie.id === id) ?? null;
}

export function getLevelById(id: string): Level | null {
  return levels.find((level) => level.id === id) ?? null;
}

export function getPublishedChallenges(): Challenge[] {
  return challenges.filter((challenge) => challenge.status === "published");
}

/**
 * MVP: единственный опубликованный Challenge — Terminator 2.
 * Всегда возвращается как Today's Challenge.
 */
export function getTodayChallengeBundle(): PublishedChallengeBundle | null {
  const challenge = getPublishedChallenges()[0];
  if (!challenge) return null;

  const level = getLevelById(challenge.levelId);
  if (!level) return null;

  const movie = getMovieById(level.movieId);
  if (!movie) return null;

  return { challenge, level, movie };
}

export function getChallengeBundleByDate(
  date: string,
): PublishedChallengeBundle | null {
  const challenge =
    challenges.find(
      (item) => item.status === "published" && item.date === date,
    ) ?? getPublishedChallenges()[0];

  if (!challenge) return null;

  const level = getLevelById(challenge.levelId);
  if (!level) return null;

  const movie = getMovieById(level.movieId);
  if (!movie) return null;

  return { challenge, level, movie };
}

/**
 * Каталог для автодополнения: ~500 фильмов (RU + EN).
 * Playable Movie-сущности мержатся сверху, чтобы у текущего челленджа
 * были канонические названия и id.
 */
export function getMovieSearchCatalog(): Array<{
  id: string;
  title: string;
  titleOriginal: string | null;
  year: number;
}> {
  const byKey = new Map<string, (typeof movieSearchCatalog)[number]>();

  for (const movie of movieSearchCatalog) {
    const key = `${movie.titleOriginal ?? movie.title}|${movie.year}`.toLowerCase();
    byKey.set(key, movie);
  }

  for (const movie of movies) {
    const entry = {
      id: movie.id,
      title: movie.title,
      titleOriginal: movie.titleOriginal,
      year: movie.year,
    };
    const key = `${movie.titleOriginal ?? movie.title}|${movie.year}`.toLowerCase();
    byKey.set(key, entry);
  }

  return Array.from(byKey.values());
}
