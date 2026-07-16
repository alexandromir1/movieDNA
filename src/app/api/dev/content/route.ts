import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import type { Challenge, ChallengeStatus, Level, Movie } from "@/types/content";

const SLUG_RE = /^[a-z0-9-]+$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const STATUSES: ChallengeStatus[] = ["draft", "ready", "scheduled"];

function guardDev() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Dev endpoint disabled in production" },
      { status: 403 },
    );
  }
  return null;
}

function dataPath(...parts: string[]) {
  return path.join(process.cwd(), "data", ...parts);
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, "utf8")) as T;
}

async function writeJson(filePath: string, value: unknown) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function resolveChallengeFile(slug: string): Promise<{
  filePath: string;
  challenge: Challenge;
} | null> {
  const preferred = dataPath("challenges", `${slug}.json`);
  try {
    const challenge = await readJson<Challenge>(preferred);
    return { filePath: preferred, challenge };
  } catch {
    // fall through — filename may differ (e.g. terminator-2-mvp)
  }

  const dir = dataPath("challenges");
  const files = await readdir(dir);
  const levelId = `level-${slug}`;

  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const filePath = path.join(dir, file);
    const challenge = await readJson<Challenge>(filePath);
    if (challenge.levelId === levelId) {
      return { filePath, challenge };
    }
  }

  return null;
}

type ContentBody =
  | {
      action: "movie";
      slug: string;
      title: string;
      titleOriginal: string;
      year: number;
      aliases?: string[];
    }
  | {
      action: "answers";
      slug: string;
      acceptedAnswers: string[];
    }
  | {
      action: "challenge";
      slug: string;
      status: ChallengeStatus;
      date: string;
    };

export async function POST(request: Request) {
  const blocked = guardDev();
  if (blocked) return blocked;

  let body: ContentBody;
  try {
    body = (await request.json()) as ContentBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.slug || !SLUG_RE.test(body.slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  if (body.action === "movie") {
    const filePath = dataPath("movies", `${body.slug}.json`);
    let movie: Movie;
    try {
      movie = await readJson<Movie>(filePath);
    } catch {
      return NextResponse.json(
        { error: `Movie not found: ${body.slug}` },
        { status: 404 },
      );
    }

    const title = body.title.trim();
    const titleOriginal = body.titleOriginal.trim();
    const year = Number(body.year);

    if (!title || !titleOriginal || !Number.isFinite(year) || year < 1888) {
      return NextResponse.json(
        { error: "title, titleOriginal and year (>= 1888) are required" },
        { status: 400 },
      );
    }

    movie.title = title;
    movie.titleOriginal = titleOriginal;
    movie.year = Math.trunc(year);
    if (Array.isArray(body.aliases)) {
      movie.aliases = body.aliases.map((item) => item.trim()).filter(Boolean);
    }

    await writeJson(filePath, movie);
    return NextResponse.json({
      ok: true,
      path: `data/movies/${body.slug}.json`,
      movie,
    });
  }

  if (body.action === "answers") {
    const filePath = dataPath("levels", `${body.slug}.json`);
    let level: Level;
    try {
      level = await readJson<Level>(filePath);
    } catch {
      return NextResponse.json(
        { error: `Level not found: ${body.slug}` },
        { status: 404 },
      );
    }

    if (!Array.isArray(body.acceptedAnswers)) {
      return NextResponse.json(
        { error: "acceptedAnswers must be an array" },
        { status: 400 },
      );
    }

    level.acceptedAnswers = body.acceptedAnswers
      .map((item) => item.trim())
      .filter(Boolean);

    await writeJson(filePath, level);
    return NextResponse.json({
      ok: true,
      path: `data/levels/${body.slug}.json`,
      acceptedAnswers: level.acceptedAnswers,
    });
  }

  if (body.action === "challenge") {
    if (!STATUSES.includes(body.status)) {
      return NextResponse.json(
        { error: "status must be draft | ready | scheduled" },
        { status: 400 },
      );
    }
    if (!DATE_RE.test(body.date)) {
      return NextResponse.json(
        { error: "date must be YYYY-MM-DD" },
        { status: 400 },
      );
    }

    const resolved = await resolveChallengeFile(body.slug);
    if (!resolved) {
      return NextResponse.json(
        { error: `Challenge not found for slug: ${body.slug}` },
        { status: 404 },
      );
    }

    resolved.challenge.status = body.status;
    resolved.challenge.date = body.date;
    await writeJson(resolved.filePath, resolved.challenge);

    return NextResponse.json({
      ok: true,
      path: path.relative(process.cwd(), resolved.filePath),
      challenge: resolved.challenge,
    });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
