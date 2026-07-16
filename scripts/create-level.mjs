#!/usr/bin/env node
/**
 * create-level — заготовка Movie / Level / Challenge по изображению.
 *
 * Usage:
 *   npm run create-level -- joker
 *   npm run create-level -- fight-club
 *
 * Ищет public/images/{slug}.{png,jpg,jpeg,webp}
 * Создаёт draft-файлы в data/. Ничего не публикует.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const IMAGES_DIR = path.join(ROOT, "public", "images");
const MOVIES_DIR = path.join(ROOT, "data", "movies");
const LEVELS_DIR = path.join(ROOT, "data", "levels");
const CHALLENGES_DIR = path.join(ROOT, "data", "challenges");

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function titleCaseFromSlug(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function writeJsonIfMissing(filePath, data, label) {
  if (existsSync(filePath)) {
    console.log(`  · skip ${label} (уже есть): ${path.relative(ROOT, filePath)}`);
    return false;
  }
  writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log(`  ✓ created ${label}: ${path.relative(ROOT, filePath)}`);
  return true;
}

function findImage(slug) {
  if (!existsSync(IMAGES_DIR)) {
    fail(`Папка не найдена: public/images`);
  }

  const files = readdirSync(IMAGES_DIR);

  for (const ext of IMAGE_EXTENSIONS) {
    const exact = `${slug}${ext}`;
    if (files.includes(exact)) {
      return { filename: exact, absolute: path.join(IMAGES_DIR, exact) };
    }
  }

  // fuzzy: fightclub → fight-club.jpeg etc.
  const normalized = slug.replace(/-/g, "");
  const match = files.find((file) => {
    const base = path.parse(file).name.toLowerCase().replace(/[-_]/g, "");
    const ext = path.extname(file).toLowerCase();
    return base === normalized && IMAGE_EXTENSIONS.includes(ext);
  });

  if (match) {
    return { filename: match, absolute: path.join(IMAGES_DIR, match) };
  }

  const available = files
    .filter((file) => IMAGE_EXTENSIONS.includes(path.extname(file).toLowerCase()))
    .join(", ");
  fail(
    `Изображение для «${slug}» не найдено в public/images.\n` +
      `  Ожидалось: ${slug}.png | ${slug}.jpg | ${slug}.jpeg | ${slug}.webp\n` +
      `  Доступно: ${available || "(пусто)"}`,
  );
}

/** Читает width/height из PNG или JPEG без внешних зависимостей. */
function readImageSize(filePath) {
  const buffer = readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".png") {
    // PNG IHDR: bytes 16-23 after 8-byte signature
    if (buffer.length < 24 || buffer.toString("ascii", 1, 4) !== "PNG") {
      fail(`Некорректный PNG: ${filePath}`);
    }
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
    };
  }

  if (ext === ".jpg" || ext === ".jpeg") {
    // Scan JPEG SOF0/SOF2 markers
    let offset = 2;
    while (offset < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = buffer[offset + 1];
      if (marker === 0xd8 || marker === 0xd9) {
        offset += 2;
        continue;
      }
      const size = buffer.readUInt16BE(offset + 2);
      // SOF0..SOF3, SOF5..SOF7, SOF9..SOF11, SOF13..SOF15
      const isSof =
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf);
      if (isSof) {
        return {
          height: buffer.readUInt16BE(offset + 5),
          width: buffer.readUInt16BE(offset + 7),
        };
      }
      offset += 2 + size;
    }
    fail(`Не удалось прочитать размеры JPEG: ${filePath}`);
  }

  if (ext === ".webp") {
    // RIFF....WEBP + VP8/VP8L/VP8X
    if (buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WEBP") {
      fail(`Некорректный WebP: ${filePath}`);
    }
    const chunk = buffer.toString("ascii", 12, 16);
    if (chunk === "VP8X") {
      return {
        width: 1 + buffer.readUIntLE(24, 3),
        height: 1 + buffer.readUIntLE(27, 3),
      };
    }
    if (chunk === "VP8 ") {
      return {
        width: buffer.readUInt16LE(26) & 0x3fff,
        height: buffer.readUInt16LE(28) & 0x3fff,
      };
    }
    if (chunk === "VP8L") {
      const bits = buffer.readUInt32LE(21);
      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits >> 14) & 0x3fff) + 1,
      };
    }
    fail(`Неподдерживаемый WebP chunk: ${chunk}`);
  }

  fail(`Неподдерживаемый формат: ${ext}`);
}

function todayUtcDate() {
  return new Date().toISOString().slice(0, 10);
}

function main() {
  const rawSlug = process.argv[2];
  if (!rawSlug) {
    fail(
      "Укажите slug изображения.\n" +
        "  Пример: npm run create-level -- joker\n" +
        "           npm run create-level -- fight-club",
    );
  }

  const slug = slugify(rawSlug);
  if (!slug) fail(`Некорректный slug: «${rawSlug}»`);

  console.log(`\nMovieDNA · create-level «${slug}»\n`);

  const image = findImage(slug);
  const { width, height } = readImageSize(image.absolute);
  const imagePublicPath = `/images/${image.filename}`;
  const displayTitle = titleCaseFromSlug(slug);

  console.log(`  image:  ${imagePublicPath}`);
  console.log(`  size:   ${width}×${height}`);

  ensureDir(MOVIES_DIR);
  ensureDir(LEVELS_DIR);
  ensureDir(CHALLENGES_DIR);

  const movieId = `movie-${slug}`;
  const levelId = `level-${slug}`;
  const challengeId = `challenge-${slug}`;

  writeJsonIfMissing(
    path.join(MOVIES_DIR, `${slug}.json`),
    {
      id: movieId,
      title: "",
      titleOriginal: displayTitle,
      year: 0,
      aliases: [],
    },
    "Movie",
  );

  writeJsonIfMissing(
    path.join(LEVELS_DIR, `${slug}.json`),
    {
      id: levelId,
      movieId,
      difficulty: "medium",
      image: imagePublicPath,
      width,
      height,
      acceptedAnswers: [],
      revealRegions: [],
    },
    "Level",
  );

  writeJsonIfMissing(
    path.join(CHALLENGES_DIR, `${slug}.json`),
    {
      id: challengeId,
      levelId,
      date: todayUtcDate(),
      status: "draft",
    },
    "Challenge",
  );

  console.log(`
Дальше:
  1. Заполни названия в data/movies/${slug}.json
     и acceptedAnswers в data/levels/${slug}.json
  2. Открой Content Studio:  /dev?level=${slug}
  3. Нарисуй Reveal Regions (D → Developer Mode)
  4. Когда checklist готов:
       status: "ready"  →  затем  "scheduled" + date (publishAt)
     в data/challenges/${slug}.json
  5. Commit + push — Vercel подхватит JSON
`);
}

main();
