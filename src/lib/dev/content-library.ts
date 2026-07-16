import { existsSync } from "node:fs";
import path from "node:path";

import {
  loadAllChallenges,
  loadAllLevels,
  loadAllMovies,
  slugFromLevelId,
  slugFromMovieId,
} from "@/lib/content/load-fs";
import { getChallengeScheduleBucket } from "@/lib/content/schedule";
import { getUtcDateString } from "@/lib/game/daily";

import type {
  Challenge,
  ChallengeScheduleBucket,
  ChallengeStatus,
  Level,
  Movie,
} from "@/types/content";

export interface DevChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface StudioMovieRow {
  slug: string;
  movie: Movie;
  label: string;
  filled: boolean;
}

export interface StudioLevelRow {
  slug: string;
  label: string;
  level: Level;
  movie: Movie | null;
  challenge: Challenge | null;
  checklist: DevChecklistItem[];
  readyForSchedule: boolean;
  areaRegionCount: number;
  hasFullReveal: boolean;
}

export interface StudioChallengeRow {
  slug: string;
  challenge: Challenge;
  level: Level | null;
  movie: Movie | null;
  label: string;
  status: ChallengeStatus;
  publishAt: string;
  bucket: ChallengeScheduleBucket | null;
}

export interface ContentStudioData {
  today: string;
  movies: StudioMovieRow[];
  levels: StudioLevelRow[];
  challenges: StudioChallengeRow[];
  todayChallenge: StudioChallengeRow | null;
  upcoming: StudioChallengeRow[];
  archive: StudioChallengeRow[];
  readyUnscheduled: StudioChallengeRow[];
  drafts: StudioChallengeRow[];
}

function titleCaseFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function displayLabel(movie: Movie | null, slug: string): string {
  if (movie?.title?.trim()) return movie.title.trim();
  if (movie?.titleOriginal?.trim()) return movie.titleOriginal.trim();
  return titleCaseFromSlug(slug);
}

function isMovieFilled(movie: Movie): boolean {
  return Boolean(
    movie.title.trim() &&
      (movie.titleOriginal?.trim() ?? "") &&
      movie.year > 0,
  );
}

function buildChecklist(input: {
  level: Level;
  movie: Movie | null;
  challenge: Challenge | null;
}): DevChecklistItem[] {
  const { level, movie, challenge } = input;
  const imagePath = path.join(
    process.cwd(),
    "public",
    level.image.replace(/^\//, ""),
  );
  const imageFound = Boolean(level.image) && existsSync(imagePath);
  const movieFilled = Boolean(movie && isMovieFilled(movie));
  const answersFilled = (level.acceptedAnswers?.length ?? 0) >= 1;
  const areaRegions = (level.revealRegions ?? []).filter(
    (region) => region.kind !== "full_image",
  );
  const hasFullReveal = (level.revealRegions ?? []).some(
    (region) => region.kind === "full_image",
  );
  const regionsCreated = areaRegions.length >= 4;
  const readyForSchedule =
    imageFound &&
    movieFilled &&
    answersFilled &&
    regionsCreated &&
    hasFullReveal &&
    challenge !== null;

  return [
    { id: "image", label: "Image найдено", done: imageFound },
    { id: "movie", label: "Movie заполнен", done: movieFilled },
    {
      id: "answers",
      label: "Accepted Answers заполнены",
      done: answersFilled,
    },
    {
      id: "regions",
      label: `Reveal Regions созданы (${areaRegions.length}/4 area)`,
      done: regionsCreated,
    },
    { id: "full", label: "Full Reveal существует", done: hasFullReveal },
    {
      id: "ready",
      label: "Ready to schedule",
      done: readyForSchedule,
    },
  ];
}

/** Полный снимок Content Studio для локальной подготовки контента. */
export function loadContentStudioData(
  today: string = getUtcDateString(),
): ContentStudioData {
  const movies = loadAllMovies();
  const levels = loadAllLevels();
  const challenges = loadAllChallenges();

  const movieById = new Map(movies.map((movie) => [movie.id, movie]));
  const levelById = new Map(levels.map((level) => [level.id, level]));
  const challengeByLevelId = new Map(
    challenges.map((challenge) => [challenge.levelId, challenge]),
  );

  const movieRows: StudioMovieRow[] = movies.map((movie) => {
    const slug = slugFromMovieId(movie.id);
    return {
      slug,
      movie,
      label: displayLabel(movie, slug),
      filled: isMovieFilled(movie),
    };
  });

  const levelRows: StudioLevelRow[] = levels.map((level) => {
    const slug = slugFromLevelId(level.id);
    const movie = movieById.get(level.movieId) ?? null;
    const challenge = challengeByLevelId.get(level.id) ?? null;
    const areaRegions = (level.revealRegions ?? []).filter(
      (region) => region.kind !== "full_image",
    );
    const hasFullReveal = (level.revealRegions ?? []).some(
      (region) => region.kind === "full_image",
    );
    const checklist = buildChecklist({ level, movie, challenge });
    const readyForSchedule =
      checklist.find((item) => item.id === "ready")?.done ?? false;

    return {
      slug,
      label: displayLabel(movie, slug),
      level,
      movie,
      challenge,
      checklist,
      readyForSchedule,
      areaRegionCount: areaRegions.length,
      hasFullReveal,
    };
  });

  const challengeRows: StudioChallengeRow[] = challenges
    .map((challenge) => {
      const level = levelById.get(challenge.levelId) ?? null;
      const movie = level ? movieById.get(level.movieId) ?? null : null;
      const slug = level
        ? slugFromLevelId(level.id)
        : challenge.id.replace(/^challenge-/, "");
      return {
        slug,
        challenge,
        level,
        movie,
        label: displayLabel(movie, slug),
        status: challenge.status,
        publishAt: challenge.date,
        bucket: getChallengeScheduleBucket(challenge, today),
      };
    })
    .sort((a, b) => a.publishAt.localeCompare(b.publishAt));

  return {
    today,
    movies: movieRows.sort((a, b) => a.label.localeCompare(b.label)),
    levels: levelRows.sort((a, b) => a.label.localeCompare(b.label)),
    challenges: challengeRows,
    todayChallenge:
      challengeRows.find((row) => row.bucket === "today") ?? null,
    upcoming: challengeRows.filter((row) => row.bucket === "upcoming"),
    archive: challengeRows
      .filter((row) => row.bucket === "archive")
      .sort((a, b) => b.publishAt.localeCompare(a.publishAt)),
    readyUnscheduled: challengeRows.filter((row) => row.status === "ready"),
    drafts: challengeRows.filter((row) => row.status === "draft"),
  };
}

/** @deprecated используй loadContentStudioData */
export async function loadDevContentLibrary() {
  return loadContentStudioData().levels;
}
