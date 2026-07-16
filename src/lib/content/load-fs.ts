import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import type { Challenge, Level, Movie } from "@/types/content";

const ROOT = process.cwd();

function readJsonDir<T>(dirRelative: string, skipFiles: string[] = []): T[] {
  const dir = path.join(ROOT, dirRelative);
  if (!existsSync(dir)) return [];

  return readdirSync(dir)
    .filter(
      (file) =>
        file.endsWith(".json") && !skipFiles.includes(file),
    )
    .sort((a, b) => a.localeCompare(b))
    .map((file) => {
      const raw = readFileSync(path.join(dir, file), "utf8");
      return JSON.parse(raw) as T;
    });
}

/** Все Movie из data/movies (без search-catalog). */
export function loadAllMovies(): Movie[] {
  return readJsonDir<Movie>("data/movies", ["search-catalog.json"]);
}

/** Все Level из data/levels. */
export function loadAllLevels(): Level[] {
  return readJsonDir<Level>("data/levels");
}

/** Все Challenge из data/challenges. */
export function loadAllChallenges(): Challenge[] {
  return readJsonDir<Challenge>("data/challenges");
}

export function slugFromLevelId(levelId: string): string {
  return levelId.replace(/^level-/, "");
}

export function slugFromMovieId(movieId: string): string {
  return movieId.replace(/^movie-/, "");
}
