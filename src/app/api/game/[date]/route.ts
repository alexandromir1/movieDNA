import { NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ date: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { date } = await params;
  // TODO: вернуть пазл по дате
  return NextResponse.json({ date, puzzle: null });
}
