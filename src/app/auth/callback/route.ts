import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    // TODO: обменять code на сессию через Supabase
    void code;
  }

  return NextResponse.redirect(`${origin}${next}`);
}
