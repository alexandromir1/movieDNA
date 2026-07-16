import { NextResponse } from "next/server";

import { getTodayChallengeBundle } from "@/lib/content/catalog";

export async function GET() {
  const bundle = getTodayChallengeBundle();
  return NextResponse.json({ challenge: bundle });
}
