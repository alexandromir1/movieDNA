import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

import type { Challenge, Level, Movie } from "@/types/content";
import { getUtcDateString } from "@/lib/game/daily";
import { slugifyLevelSlug } from "@/lib/dev/slugify";

const ROOT = process.cwd();
const IMAGES_DIR = path.join(ROOT, "public", "images");
const MOVIES_DIR = path.join(ROOT, "data", "movies");
const LEVELS_DIR = path.join(ROOT, "data", "levels");
const CHALLENGES_DIR = path.join(ROOT, "data", "challenges");

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"] as const;
type ImageExt = (typeof IMAGE_EXTENSIONS)[number];

export class LevelCreatorError extends Error {
  constructor(
    message: string,
    readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = "LevelCreatorError";
  }
}

export interface CreateLevelMovieInput {
  title: string;
  titleOriginal: string;
  year: number;
  aliases?: string[];
}

export interface CreateLevelFromImageInput {
  slug: string;
  file: {
    buffer: Buffer;
    /** Original filename — used only for extension detection */
    originalName: string;
  };
  /** Existing Movie id (`movie-{slug}`) — prefer over creating */
  movieId?: string;
  /** Create / fill Movie when missing (uses level slug for file name) */
  movie?: CreateLevelMovieInput;
}

export interface CreateLevelResult {
  slug: string;
  movie: Movie;
  level: Level;
  challenge: Challenge;
  image: string;
  width: number;
  height: number;
  created: {
    movie: boolean;
    level: boolean;
    challenge: boolean;
    image: boolean;
  };
}

export interface DuplicateLevelResult {
  slug: string;
  movie: Movie;
  level: Level;
  challenge: Challenge;
}

function ensureDir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

function writeJson(filePath: string, value: unknown) {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function titleCaseFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function extensionFromName(name: string): ImageExt {
  const ext = path.extname(name).toLowerCase();
  if ((IMAGE_EXTENSIONS as readonly string[]).includes(ext)) {
    return ext as ImageExt;
  }
  throw new LevelCreatorError(
    `Unsupported image type: ${ext || "(none)"}. Use png, jpg, jpeg, or webp.`,
  );
}

function readImageSizeFromBuffer(
  buffer: Buffer,
  ext: ImageExt,
): { width: number; height: number } {
  if (ext === ".png") {
    if (buffer.length < 24 || buffer.toString("ascii", 1, 4) !== "PNG") {
      throw new LevelCreatorError("Invalid PNG file");
    }
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
    };
  }

  if (ext === ".jpg" || ext === ".jpeg") {
    let offset = 2;
    while (offset < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = buffer[offset + 1];
      if (marker === 0xd8 || marker === 0xd9) {
        offset += 2;
        continue;
      }
      const size = buffer.readUInt16BE(offset + 2);
      const isSof =
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf);
      if (isSof) {
        return {
          height: buffer.readUInt16BE(offset + 5),
          width: buffer.readUInt16BE(offset + 7),
        };
      }
      offset += 2 + size;
    }
    throw new LevelCreatorError("Could not read JPEG dimensions");
  }

  if (ext === ".webp") {
    if (
      buffer.toString("ascii", 0, 4) !== "RIFF" ||
      buffer.toString("ascii", 8, 12) !== "WEBP"
    ) {
      throw new LevelCreatorError("Invalid WebP file");
    }
    const chunk = buffer.toString("ascii", 12, 16);
    if (chunk === "VP8X") {
      return {
        width: 1 + buffer.readUIntLE(24, 3),
        height: 1 + buffer.readUIntLE(27, 3),
      };
    }
    if (chunk === "VP8 ") {
      return {
        width: buffer.readUInt16LE(26) & 0x3fff,
        height: buffer.readUInt16LE(28) & 0x3fff,
      };
    }
    if (chunk === "VP8L") {
      const bits = buffer.readUInt32LE(21);
      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits >> 14) & 0x3fff) + 1,
      };
    }
    throw new LevelCreatorError(`Unsupported WebP chunk: ${chunk}`);
  }

  throw new LevelCreatorError(`Unsupported format: ${ext}`);
}

function movieFilePath(slug: string) {
  return path.join(MOVIES_DIR, `${slug}.json`);
}

function levelFilePath(slug: string) {
  return path.join(LEVELS_DIR, `${slug}.json`);
}

function challengeFilePath(slug: string) {
  return path.join(CHALLENGES_DIR, `${slug}.json`);
}

function loadMovieById(movieId: string): Movie | null {
  const slug = movieId.replace(/^movie-/, "");
  const filePath = movieFilePath(slug);
  if (!existsSync(filePath)) return null;
  return readJson<Movie>(filePath);
}

/**
 * Единственный сервис создания контента Content Studio.
 * Movie (при необходимости) · Image · Level · Challenge · (future) duplicate.
 */
export const LevelCreator = {
  slugify: slugifyLevelSlug,

  async createLevelFromImage(
    input: CreateLevelFromImageInput,
  ): Promise<CreateLevelResult> {
    const slug = slugifyLevelSlug(input.slug);
    if (!slug) {
      throw new LevelCreatorError("Invalid slug");
    }

    const levelPath = levelFilePath(slug);
    if (existsSync(levelPath)) {
      throw new LevelCreatorError(
        `Level already exists: ${slug}. Choose another slug or open it in the editor.`,
        409,
      );
    }

    const ext = extensionFromName(input.file.originalName);
    const { width, height } = readImageSizeFromBuffer(input.file.buffer, ext);
    if (width < 1 || height < 1) {
      throw new LevelCreatorError("Invalid image dimensions");
    }

    ensureDir(IMAGES_DIR);
    ensureDir(MOVIES_DIR);
    ensureDir(LEVELS_DIR);
    ensureDir(CHALLENGES_DIR);

    const filename = `${slug}${ext}`;
    const absoluteImage = path.join(IMAGES_DIR, filename);
    const imagePublicPath = `/images/${filename}`;
    writeFileSync(absoluteImage, input.file.buffer);

    let movie: Movie;
    let createdMovie = false;

    if (input.movieId) {
      const existing = loadMovieById(input.movieId);
      if (!existing) {
        throw new LevelCreatorError(`Movie not found: ${input.movieId}`, 404);
      }
      movie = existing;
    } else {
      const moviePath = movieFilePath(slug);
      if (existsSync(moviePath)) {
        movie = readJson<Movie>(moviePath);
        if (input.movie) {
          const title = input.movie.title.trim();
          const titleOriginal = input.movie.titleOriginal.trim();
          const year = Math.trunc(Number(input.movie.year));
          if (title) movie.title = title;
          if (titleOriginal) movie.titleOriginal = titleOriginal;
          if (Number.isFinite(year) && year >= 1888) movie.year = year;
          if (Array.isArray(input.movie.aliases)) {
            movie.aliases = input.movie.aliases
              .map((item) => item.trim())
              .filter(Boolean);
          }
          writeJson(moviePath, movie);
        }
      } else {
        const title = input.movie?.title?.trim() ?? "";
        const titleOriginal =
          input.movie?.titleOriginal?.trim() || titleCaseFromSlug(slug);
        const yearRaw = Number(input.movie?.year);
        const year =
          Number.isFinite(yearRaw) && yearRaw >= 1888
            ? Math.trunc(yearRaw)
            : 0;
        movie = {
          id: `movie-${slug}`,
          title,
          titleOriginal,
          year,
          aliases: (input.movie?.aliases ?? [])
            .map((item) => item.trim())
            .filter(Boolean),
        };
        writeJson(moviePath, movie);
        createdMovie = true;
      }
    }

    const level: Level = {
      id: `level-${slug}`,
      movieId: movie.id,
      difficulty: "medium",
      image: imagePublicPath,
      width,
      height,
      acceptedAnswers: [],
      revealRegions: [],
    };
    writeJson(levelPath, level);

    const challengePath = challengeFilePath(slug);
    let challenge: Challenge;
    let createdChallenge = false;
    if (existsSync(challengePath)) {
      challenge = readJson<Challenge>(challengePath);
    } else {
      challenge = {
        id: `challenge-${slug}`,
        levelId: level.id,
        date: getUtcDateString(),
        status: "draft",
      };
      writeJson(challengePath, challenge);
      createdChallenge = true;
    }

    return {
      slug,
      movie,
      level,
      challenge,
      image: imagePublicPath,
      width,
      height,
      created: {
        movie: createdMovie,
        level: true,
        challenge: createdChallenge,
        image: true,
      },
    };
  },

  /**
   * Architecture hook for a follow-up PR.
   * Copies Level + image under a new slug and creates a draft Challenge.
   * Movie usually stays shared via the same movieId.
   */
  async duplicateLevel(
    _sourceSlug: string,
    _targetSlug: string,
  ): Promise<DuplicateLevelResult> {
    throw new LevelCreatorError(
      "LevelCreator.duplicateLevel is not implemented yet",
      501,
    );
  },
};
