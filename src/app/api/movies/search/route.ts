import { NextResponse } from "next/server";

import { isLocale, type Locale } from "@/lib/i18n/types";
import { getRequestLocale } from "@/lib/i18n/server";
import { searchMovies } from "@/lib/movies/search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";
  const localeParam = searchParams.get("locale");
  const locale: Locale = isLocale(localeParam)
    ? localeParam
    : await getRequestLocale();

  if (query.length < 1) {
    return NextResponse.json({ movies: [] });
  }

  const movies = await searchMovies(query, 8, locale);

  return NextResponse.json(
    { movies },
    {
      headers: {
        "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
      },
    },
  );
}
