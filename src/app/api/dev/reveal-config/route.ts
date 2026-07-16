import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { REVEAL_PENALTIES } from "@/config/economy";

import type { Level, RevealRegion } from "@/types/content";
import type { RevealImageConfig } from "@/types/reveal-image";

function toLevelRevealRegions(config: RevealImageConfig): RevealRegion[] {
  const areaRegions: RevealRegion[] = config.regions.map((region, index) => {
    const displayOrder = index + 1;
    return {
      id: region.id,
      name: region.label,
      polygon: region.points.map((point) => {
        if (Array.isArray(point)) {
          return [point[0], point[1]];
        }
        const coordinate = point as { x: number; y: number };
        return [coordinate.x, coordinate.y];
      }),
      displayOrder,
      scorePenalty:
        REVEAL_PENALTIES[displayOrder as keyof typeof REVEAL_PENALTIES] ?? 260,
      kind: "area",
    };
  });

  const fullOrder = areaRegions.length + 1;
  areaRegions.push({
    id: "full",
    name: "Полное изображение",
    polygon: [],
    displayOrder: fullOrder,
    scorePenalty:
      REVEAL_PENALTIES[fullOrder as keyof typeof REVEAL_PENALTIES] ?? 260,
    kind: "full_image",
  });

  return areaRegions;
}

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
    levelSlug?: string;
  };

  if (!body.filename || !body.config) {
    return NextResponse.json(
      { error: "filename and config are required" },
      { status: 400 },
    );
  }

  // Preferred path: merge into data/levels/{slug}.json
  if (body.levelSlug) {
    if (!/^[a-z0-9-]+$/i.test(body.levelSlug)) {
      return NextResponse.json({ error: "Invalid levelSlug" }, { status: 400 });
    }

    const levelPath = path.join(
      process.cwd(),
      "data",
      "levels",
      `${body.levelSlug}.json`,
    );

    let level: Level;
    try {
      level = JSON.parse(await readFile(levelPath, "utf8")) as Level;
    } catch {
      return NextResponse.json(
        { error: `Level not found: ${body.levelSlug}` },
        { status: 404 },
      );
    }

    level.width = body.config.width;
    level.height = body.config.height;
    level.image = body.config.image;
    level.revealRegions = toLevelRevealRegions(body.config);

    await writeFile(levelPath, `${JSON.stringify(level, null, 2)}\n`, "utf8");

    return NextResponse.json({
      ok: true,
      path: `data/levels/${body.levelSlug}.json`,
    });
  }

  // Legacy: save raw RevealImageConfig into data/{filename}
  if (!/^[a-z0-9_-]+\.json$/i.test(body.filename)) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  const filePath = path.join(process.cwd(), "data", body.filename);
  await writeFile(filePath, `${JSON.stringify(body.config, null, 2)}\n`, "utf8");

  return NextResponse.json({ ok: true, path: `data/${body.filename}` });
}
