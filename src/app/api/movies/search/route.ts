import { NextResponse } from "next/server";

import { searchMovies } from "@/lib/movies/search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < 1) {
    return NextResponse.json({ movies: [] });
  }

  const movies = await searchMovies(query);

  return NextResponse.json(
    { movies },
    {
      headers: {
        "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
      },
    },
  );
}
