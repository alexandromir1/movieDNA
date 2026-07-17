import { NextResponse } from "next/server";

import {
  LevelCreator,
  LevelCreatorError,
} from "@/lib/dev/level-creator";

function guardDev() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Dev endpoint disabled in production" },
      { status: 403 },
    );
  }
  return null;
}

/**
 * Единое действие создания Level в Content Studio:
 * image + Movie (при необходимости) + Level + Challenge draft.
 */
export async function POST(request: Request) {
  const blocked = guardDev();
  if (blocked) return blocked;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });
  }

  const slugRaw = String(form.get("slug") ?? "");
  const movieIdRaw = String(form.get("movieId") ?? "").trim();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length === 0) {
    return NextResponse.json({ error: "Empty file" }, { status: 400 });
  }

  const title = String(form.get("title") ?? "").trim();
  const titleOriginal = String(form.get("titleOriginal") ?? "").trim();
  const yearRaw = String(form.get("year") ?? "").trim();
  const year = yearRaw ? Number(yearRaw) : NaN;

  try {
    const result = await LevelCreator.createLevelFromImage({
      slug: slugRaw,
      file: {
        buffer,
        originalName: file.name || `${slugRaw}.png`,
      },
      movieId: movieIdRaw || undefined,
      movie: movieIdRaw
        ? undefined
        : {
            title,
            titleOriginal,
            year: Number.isFinite(year) ? year : 0,
          },
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof LevelCreatorError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }
    console.error("[create-level]", error);
    return NextResponse.json({ error: "Create level failed" }, { status: 500 });
  }
}
