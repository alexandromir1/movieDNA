#!/usr/bin/env node
/**
 * Migrates movie + search-catalog titles to LocalizedString { ru, en }.
 * Run: node scripts/migrate-i18n-content.mjs
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const MOVIES_DIR = path.join(ROOT, "data/movies");

const CATEGORY_EN = {
  "⏰ Если нравится путешествие во времени":
    "⏰ If you like time travel",
  "⏳ Если нравятся путешествия во времени":
    "⏳ If you like time-travel stories",
  "☢️ Если нравится постапокалипсис":
    "☢️ If you like post-apocalypse",
  "⚔️ Если хочется эпического фэнтези":
    "⚔️ If you want epic fantasy",
  "⚔️ Если хочется эпичных исторических битв":
    "⚔️ If you want epic historical battles",
  "✈️ Если хочется приключений по всему миру":
    "✈️ If you want globe-trotting adventure",
  "✨ Если нравится мистика с душой":
    "✨ If you like soulful mystery",
  "❤️ Если хочется большой любви":
    "❤️ If you want a grand love story",
  "❤️ Если хочется доброй истории о жизни":
    "❤️ If you want a warm life story",
  "🃏 Если нравится харизматичный злодей":
    "🃏 If you like a charismatic villain",
  "🌀 Если хочется ломать реальность":
    "🌀 If you want to bend reality",
  "🌊 Если нравится море": "🌊 If you love the sea",
  "🌎 Если нравятся путешествия через эпохи":
    "🌎 If you like journeys across eras",
  "🍻 Если хочется безумных комедий":
    "🍻 If you want wild comedies",
  "🎄 Если хочется новогоднего настроения":
    "🎄 If you want holiday vibes",
  "🎩 Если нравятся обаятельные мошенники":
    "🎩 If you like charming con artists",
  "🎩 Если хочется харизматичных антигероев":
    "🎩 If you want charismatic antiheroes",
  "🎬 Если нравится Джеймс Кэмерон":
    "🎬 If you like James Cameron",
  "🎬 Если нравится Джим Керри в серьёзной роли":
    "🎬 If you like Jim Carrey in a serious role",
  "🎬 Если нравится Дэвид Финчер":
    "🎬 If you like David Fincher",
  "🎬 Если нравится Коппола": "🎬 If you like Coppola",
  "🎬 Если нравится Мартин Скорсезе":
    "🎬 If you like Martin Scorsese",
  "🎬 Если нравится Нолан": "🎬 If you like Nolan",
  "🎬 Если нравится Ридли Скотт":
    "🎬 If you like Ridley Scott",
  "🎬 Если нравится Стивен Спилберг":
    "🎬 If you like Steven Spielberg",
  "🎬 Если нравится Том Хэнкс": "🎬 If you like Tom Hanks",
  "🎬 Если нравится Фрэнк Дарабонт":
    "🎬 If you like Frank Darabont",
  "🎬 Если нравятся революционные фантастические фильмы":
    "🎬 If you like groundbreaking sci-fi",
  "🎬 Если хочется комедий про друзей":
    "🎬 If you want buddy comedies",
  "🎭 Если нравятся фильмы о природе реальности":
    "🎭 If you like films about the nature of reality",
  "🏛️ Если нравится атмосфера Древнего мира":
    "🏛️ If you like the ancient world",
  "🏰 Если нравится волшебный мир":
    "🏰 If you like a magical world",
  "🏴‍☠️ Если хочется приключений":
    "🏴‍☠️ If you want adventure",
  "🐉 Если хочется сказочных приключений":
    "🐉 If you want fairy-tale adventure",
  "👑 Если нравится мафия": "👑 If you like the mafia",
  "👑 Если хочется современной сказки":
    "👑 If you want a modern fairy tale",
  "👨‍👦 Если нравится семейная драма":
    "👨‍👦 If you like family drama",
  "👶 Если нравятся дети против взрослых":
    "👶 If you like kids vs adults",
  "💊 Если хочется ещё больше вопросов о реальности":
    "💊 If you want more questions about reality",
  "💚 Если хочется сильной человеческой драмы":
    "💚 If you want powerful human drama",
  "💥 Если нравятся серьёзные супергерои":
    "💥 If you like serious superheroes",
  "💰 Если нравятся истории о больших деньгах":
    "💰 If you like big-money stories",
  "🔥 Если хочется безумного экшена":
    "🔥 If you want wild action",
  "😂 Если нравится лёгкий юмор": "😂 If you like light humor",
  "😂 Если нравится семейная комедия":
    "😂 If you like family comedy",
  "😂 Если нравится юмор для взрослых и детей":
    "😂 If you like humor for kids and adults",
  "😄 Если нравится лёгкая фантастика":
    "😄 If you like light sci-fi",
  "🚀 Если хочется ещё космоса": "🚀 If you want more space",
  "🚗 Если нравится скорость": "🚗 If you like speed",
  "🚗 Если хочется приключений": "🚗 If you want adventure",
  "🚢 Если нравятся исторические драмы":
    "🚢 If you like historical dramas",
  "🤖 Если нравится киберпанк": "🤖 If you like cyberpunk",
  "🤖 Если хочется фантастического экшена":
    "🤖 If you want sci-fi action",
  "🤣 Если нравится чёрный юмор": "🤣 If you like dark humor",
  "🥊 Если нравятся фильмы, ломающие сознание":
    "🥊 If you like mind-bending films",
  "🦇 Если хочется ещё Бэтмена": "🦇 If you want more Batman",
  "🧠 Если нравятся головоломки": "🧠 If you like puzzles",
  "🧠 Если нравятся идеи": "🧠 If you like big ideas",
  "🧠 Если хочется задуматься о жизни":
    "🧠 If you want to reflect on life",
  "🧠 Если хочется психологического напряжения":
    "🧠 If you want psychological tension",
  "🪄 Если хочется магии": "🪄 If you want magic",
};

const NOTE_EN = {
  "борьба за выживание": "a fight for survival",
  "война и любовь": "war and love",
  "грандиозное приключение": "a grand adventure",
  "ещё одна масштабная история Кэмерона":
    "another sweeping Cameron story",
  "культовый экшен": "iconic action",
  "любовь вопреки времени": "love against time",
  "масштаб истории глазами обычных людей":
    "history through ordinary eyes",
  "сильные чувства и потеря": "deep feeling and loss",
  "трагическая романтика": "tragic romance",
};

function alreadyLocalized(value) {
  return (
    value &&
    typeof value === "object" &&
    typeof value.ru === "string" &&
    typeof value.en === "string"
  );
}

function loc(ru, en) {
  const r = String(ru ?? "").trim();
  const e = String(en ?? "").trim();
  return { ru: r, en: e || r };
}

function migrateMovie(movie) {
  if (alreadyLocalized(movie.title)) return movie;

  const next = { ...movie };
  next.title = loc(movie.title, movie.titleOriginal);
  delete next.titleOriginal;

  if (Array.isArray(movie.recommendations)) {
    next.recommendations = movie.recommendations.map((cat) => ({
      ...cat,
      title: alreadyLocalized(cat.title)
        ? cat.title
        : loc(cat.title, CATEGORY_EN[cat.title] ?? cat.title),
      items: (cat.items ?? []).map((item) => {
        if (!item.note) return item;
        if (alreadyLocalized(item.note)) return item;
        return {
          ...item,
          note: loc(item.note, NOTE_EN[item.note] ?? item.note),
        };
      }),
    }));
  }

  return next;
}

function migrateCatalogEntry(entry) {
  if (alreadyLocalized(entry.title)) {
    const { titleOriginal, ...rest } = entry;
    return rest;
  }
  const next = {
    ...entry,
    title: loc(entry.title, entry.titleOriginal),
  };
  delete next.titleOriginal;
  return next;
}

let moviesChanged = 0;
for (const file of readdirSync(MOVIES_DIR)) {
  if (!file.endsWith(".json") || file === "search-catalog.json") continue;
  const full = path.join(MOVIES_DIR, file);
  const raw = JSON.parse(readFileSync(full, "utf8"));
  const migrated = migrateMovie(raw);
  if (JSON.stringify(raw) !== JSON.stringify(migrated)) {
    writeFileSync(full, `${JSON.stringify(migrated, null, 2)}\n`);
    moviesChanged++;
  }
}

const catalogPath = path.join(MOVIES_DIR, "search-catalog.json");
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
const nextCatalog = catalog.map(migrateCatalogEntry);
writeFileSync(catalogPath, `${JSON.stringify(nextCatalog, null, 2)}\n`);

console.log(`Migrated ${moviesChanged} movie files + search-catalog (${nextCatalog.length} entries)`);
