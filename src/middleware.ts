import { type NextRequest, NextResponse } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Content Studio и write-API — только локально (next dev).
  if (
    process.env.NODE_ENV === "production" &&
    (pathname === "/dev" ||
      pathname.startsWith("/dev/") ||
      pathname.startsWith("/api/dev"))
  ) {
    return new NextResponse("Not Found", { status: 404 });
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
