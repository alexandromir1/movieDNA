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
