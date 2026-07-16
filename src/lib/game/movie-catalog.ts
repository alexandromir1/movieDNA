import type { Movie, MovieSuggestion } from "@/types/game";

/** Упорядоченный каталог фильмов — порядок важен для Daily-системы */
export interface CatalogMovie extends Movie, MovieSuggestion {
  sortOrder: number;
}

const frame = (seed: string) => `https://picsum.photos/seed/${seed}/1280/720`;

function buildFrames(movieKey: string): string[] {
  return Array.from({ length: 6 }, (_, index) =>
    frame(`kinoshka-${movieKey}-f${index + 1}`),
  );
}

export const movieCatalog: CatalogMovie[] = [
  { id: "00000000-0000-0000-0000-000000000001", sortOrder: 1, title: "Матрица", titleOriginal: "The Matrix", year: 1999, frameUrls: buildFrames("m1"), hints: [] },
  { id: "00000000-0000-0000-0000-000000000002", sortOrder: 2, title: "Начало", titleOriginal: "Inception", year: 2010, frameUrls: buildFrames("m2"), hints: [] },
  { id: "00000000-0000-0000-0000-000000000003", sortOrder: 3, title: "Криминальное чтиво", titleOriginal: "Pulp Fiction", year: 1994, frameUrls: buildFrames("m3"), hints: [] },
  { id: "00000000-0000-0000-0000-000000000004", sortOrder: 4, title: "Бойцовский клуб", titleOriginal: "Fight Club", year: 1999, frameUrls: buildFrames("m4"), hints: [] },
  { id: "00000000-0000-0000-0000-000000000005", sortOrder: 5, title: "Форрест Гамп", titleOriginal: "Forrest Gump", year: 1994, frameUrls: buildFrames("m5"), hints: [] },
  { id: "00000000-0000-0000-0000-000000000006", sortOrder: 6, title: "Интерстеллар", titleOriginal: "Interstellar", year: 2014, frameUrls: buildFrames("m6"), hints: [] },
  { id: "00000000-0000-0000-0000-000000000007", sortOrder: 7, title: "Темный рыцарь", titleOriginal: "The Dark Knight", year: 2008, frameUrls: buildFrames("m7"), hints: [] },
  { id: "00000000-0000-0000-0000-000000000008", sortOrder: 8, title: "Крестный отец", titleOriginal: "The Godfather", year: 1972, frameUrls: buildFrames("m8"), hints: [] },
  { id: "00000000-0000-0000-0000-000000000009", sortOrder: 9, title: "Список Шиндлера", titleOriginal: "Schindler's List", year: 1993, frameUrls: buildFrames("m9"), hints: [] },
  { id: "00000000-0000-0000-0000-000000000010", sortOrder: 10, title: "Зелёная миля", titleOriginal: "The Green Mile", year: 1999, frameUrls: buildFrames("m10"), hints: [] },
  { id: "00000000-0000-0000-0000-000000000011", sortOrder: 11, title: "Гладиатор", titleOriginal: "Gladiator", year: 2000, frameUrls: buildFrames("m11"), hints: [] },
  { id: "00000000-0000-0000-0000-000000000012", sortOrder: 12, title: "Титаник", titleOriginal: "Titanic", year: 1997, frameUrls: buildFrames("m12"), hints: [] },
  { id: "00000000-0000-0000-0000-000000000013", sortOrder: 13, title: "Аватар", titleOriginal: "Avatar", year: 2009, frameUrls: buildFrames("m13"), hints: [] },
  { id: "00000000-0000-0000-0000-000000000014", sortOrder: 14, title: "Джокер", titleOriginal: "Joker", year: 2019, frameUrls: buildFrames("m14"), hints: [] },
  { id: "00000000-0000-0000-0000-000000000015", sortOrder: 15, title: "Паразиты", titleOriginal: "Parasite", year: 2019, frameUrls: buildFrames("m15"), hints: [] },
  { id: "00000000-0000-0000-0000-000000000016", sortOrder: 16, title: "Один дома", titleOriginal: "Home Alone", year: 1990, frameUrls: buildFrames("m16"), hints: [] },
  { id: "00000000-0000-0000-0000-000000000017", sortOrder: 17, title: "Назад в будущее", titleOriginal: "Back to the Future", year: 1985, frameUrls: buildFrames("m17"), hints: [] },
  { id: "00000000-0000-0000-0000-000000000018", sortOrder: 18, title: "Чужой", titleOriginal: "Alien", year: 1979, frameUrls: buildFrames("m18"), hints: [] },
  { id: "00000000-0000-0000-0000-000000000019", sortOrder: 19, title: "Терминатор 2", titleOriginal: "Terminator 2", year: 1991, frameUrls: buildFrames("m19"), hints: [] },
  { id: "00000000-0000-0000-0000-000000000020", sortOrder: 20, title: "Король Лев", titleOriginal: "The Lion King", year: 1994, frameUrls: buildFrames("m20"), hints: [] },
  { id: "00000000-0000-0000-0000-000000000021", sortOrder: 21, title: "Шрэк", titleOriginal: "Shrek", year: 2001, frameUrls: buildFrames("m21"), hints: [] },
  { id: "00000000-0000-0000-0000-000000000022", sortOrder: 22, title: "Гарри Поттер и философский камень", titleOriginal: "Harry Potter and the Philosopher's Stone", year: 2001, frameUrls: buildFrames("m22"), hints: [] },
  { id: "00000000-0000-0000-0000-000000000023", sortOrder: 23, title: "Властелин колец: Братство кольца", titleOriginal: "The Lord of the Rings: The Fellowship of the Ring", year: 2001, frameUrls: buildFrames("m23"), hints: [] },
  { id: "00000000-0000-0000-0000-000000000024", sortOrder: 24, title: "Мстители: Финал", titleOriginal: "Avengers: Endgame", year: 2019, frameUrls: buildFrames("m24"), hints: [] },
  { id: "00000000-0000-0000-0000-000000000025", sortOrder: 25, title: "Django освобождённый", titleOriginal: "Django Unchained", year: 2012, frameUrls: buildFrames("m25"), hints: [] },
  { id: "00000000-0000-0000-0000-000000000026", sortOrder: 26, title: "Ла-Ла Ленд", titleOriginal: "La La Land", year: 2016, frameUrls: buildFrames("m26"), hints: [] },
  { id: "00000000-0000-0000-0000-000000000027", sortOrder: 27, title: "Одержимость", titleOriginal: "Whiplash", year: 2014, frameUrls: buildFrames("m27"), hints: [] },
  { id: "00000000-0000-0000-0000-000000000028", sortOrder: 28, title: "Бегущий по лезвию 2049", titleOriginal: "Blade Runner 2049", year: 2017, frameUrls: buildFrames("m28"), hints: [] },
  { id: "00000000-0000-0000-0000-000000000029", sortOrder: 29, title: "Дюна", titleOriginal: "Dune", year: 2021, frameUrls: buildFrames("m29"), hints: [] },
  { id: "00000000-0000-0000-0000-000000000030", sortOrder: 30, title: "Оппенгеймер", titleOriginal: "Oppenheimer", year: 2023, frameUrls: buildFrames("m30"), hints: [] },
];

export function toMovieSuggestions(catalog: CatalogMovie[]): MovieSuggestion[] {
  return catalog.map(({ id, title, titleOriginal, year }) => ({
    id,
    title,
    titleOriginal,
    year,
  }));
}
