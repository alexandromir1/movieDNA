/**
 * Presentation helper: ссылка на существующий киномарафон фильма.
 * Не меняет recommendations / Engine.
 */
export function movieRecommendationsHref(movieId: string): string {
  const slug = movieId.replace(/^movie-/, "");
  return `/movie/${slug}/recommendations`;
}

export function movieHasRecommendations(movie: {
  recommendations?: unknown[] | null;
}): boolean {
  return Array.isArray(movie.recommendations) && movie.recommendations.length > 0;
}
