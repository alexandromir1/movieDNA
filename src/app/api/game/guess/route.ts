import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  // TODO: обработать ответ игрока
  void body;
  return NextResponse.json({ result: null }, { status: 501 });
}
