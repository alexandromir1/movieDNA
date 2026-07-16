import { writeFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import type { RevealImageConfig } from "@/types/reveal-image";

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Dev endpoint disabled in production" },
      { status: 403 },
    );
  }

  const body = (await request.json()) as {
    filename?: string;
    config?: RevealImageConfig;
  };

  if (!body.filename || !body.config) {
    return NextResponse.json(
      { error: "filename and config are required" },
      { status: 400 },
    );
  }

  if (!/^[a-z0-9_-]+\.json$/i.test(body.filename)) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  const filePath = path.join(process.cwd(), "data", body.filename);
  await writeFile(filePath, `${JSON.stringify(body.config, null, 2)}\n`, "utf8");

  return NextResponse.json({ ok: true, path: `data/${body.filename}` });
}
