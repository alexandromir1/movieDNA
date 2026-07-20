import { NextResponse } from "next/server";

import { isLocale, type Locale } from "@/lib/i18n/types";
import { getRequestLocale } from "@/lib/i18n/server";
import { searchMovies } from "@/lib/movies/search";
import { getPostHogClient } from "@/lib/posthog-server";

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

  const posthog = getPostHogClient();
  posthog.capture({
    distinctId: "server_anonymous",
    event: "movie_searched",
    properties: {
      query_length: query.length,
      result_count: movies.length,
      locale,
    },
  });
  await posthog.shutdown();

  return NextResponse.json(
    { movies },
    {
      headers: {
        "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
      },
    },
  );
}
