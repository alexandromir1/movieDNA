export const GAME_ROUTES = {
  today: "/game",
  archive: "/archive",
  stats: "/stats",
  profile: "/profile",
  about: "/about",
  privacy: "/privacy",
  terms: "/terms",
  /** Подборка фильмов после Challenge: /movie/:slug/recommendations */
  movieRecommendations: (slug: string) =>
    `/movie/${slug}/recommendations` as const,
} as const;

/**
 * Маршруты MovieDNA v2 (новый игровой цикл).
 * Параллельны v1; production `/` и `/game` не зависят от этих путей.
 */
export const V2_ROUTES = {
  home: "/v2",
  game: "/v2/game",
  result: "/v2/result",
  archive: "/v2/archive",
} as const;
