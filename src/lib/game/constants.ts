export const GAME_ROUTES = {
  today: "/game",
  archive: "/archive",
  stats: "/stats",
  profile: "/profile",
  /** Подборка фильмов после Challenge: /movie/:slug/recommendations */
  movieRecommendations: (slug: string) =>
    `/movie/${slug}/recommendations` as const,
} as const;
