#!/usr/bin/env node
/**
 * Пишет data/movies/{slug}.json из scripts/data/movie-library-seed.json.
 * Существующие файлы не перезаписывает. Дубликаты по id/title/original — ошибка.
 *
 * Usage: node scripts/seed-movie-library.mjs
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SEED = path.join(__dirname, "data", "movie-library-seed.json");
const MOVIES_DIR = path.join(ROOT, "data", "movies");
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function norm(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-z0-9а-я]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function loadExisting() {
  if (!existsSync(MOVIES_DIR)) return [];
  return readdirSync(MOVIES_DIR)
    .filter((file) => file.endsWith(".json") && file !== "search-catalog.json")
    .map((file) => {
      const movie = JSON.parse(
        readFileSync(path.join(MOVIES_DIR, file), "utf8"),
      );
      return {
        file,
        slug: file.replace(/\.json$/, ""),
        movie,
      };
    });
}

function main() {
  const seed = JSON.parse(readFileSync(SEED, "utf8"));
  if (!Array.isArray(seed)) {
    console.error("Seed must be a JSON array");
    process.exit(1);
  }

  mkdirSync(MOVIES_DIR, { recursive: true });
  const existing = loadExisting();

  const bySlug = new Map();
  const byOrig = new Map();
  const byTitle = new Map();

  for (const row of existing) {
    bySlug.set(row.slug, row.file);
    byOrig.set(norm(row.movie.titleOriginal), row.file);
    byTitle.set(norm(row.movie.title), row.file);
  }

  let created = 0;
  let skipped = 0;
  const errors = [];

  for (const entry of seed) {
    const { slug, title, titleOriginal, year } = entry;
    if (!slug || !title || !titleOriginal || !year) {
      errors.push(`Incomplete entry: ${JSON.stringify(entry)}`);
      continue;
    }
    if (!SLUG_RE.test(slug)) {
      errors.push(`Bad slug: ${slug}`);
      continue;
    }
    if (year < 1900 || year > 2030) {
      errors.push(`Bad year for ${slug}: ${year}`);
      continue;
    }

    const filePath = path.join(MOVIES_DIR, `${slug}.json`);
    if (existsSync(filePath) || bySlug.has(slug)) {
      skipped += 1;
      continue;
    }

    const o = norm(titleOriginal);
    const t = norm(title);
    if (byOrig.has(o)) {
      errors.push(
        `Duplicate original title "${titleOriginal}" (${slug} vs ${byOrig.get(o)})`,
      );
      continue;
    }
    if (byTitle.has(t)) {
      errors.push(`Duplicate title "${title}" (${slug} vs ${byTitle.get(t)})`);
      continue;
    }

    const movie = {
      id: `movie-${slug}`,
      title,
      titleOriginal,
      year,
      aliases: [],
    };

    writeFileSync(filePath, `${JSON.stringify(movie, null, 2)}\n`, "utf8");
    bySlug.set(slug, `${slug}.json`);
    byOrig.set(o, `${slug}.json`);
    byTitle.set(t, `${slug}.json`);
    created += 1;
  }

  if (errors.length) {
    console.error("\n✖ Errors:");
    for (const error of errors) console.error(`  ${error}`);
    process.exit(1);
  }

  const total = loadExisting().length;
  console.log(`\nMovieDNA library seed`);
  console.log(`  seed entries: ${seed.length}`);
  console.log(`  created:      ${created}`);
  console.log(`  skipped:      ${skipped} (already on disk)`);
  console.log(`  total movies: ${total}`);
  console.log("");
}

main();
