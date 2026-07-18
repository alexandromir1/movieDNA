import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MovieCollectionsView } from "@/components/movie/MovieCollectionsView";
import { Container } from "@/components/layout/Container";
import {
  getMovieBySlug,
  resolveMovieRecommendations,
} from "@/lib/content/recommendations";

interface MovieRecommendationsPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: MovieRecommendationsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const movie = getMovieBySlug(slug);
  if (!movie) return { title: "Подборка" };
  return {
    title: `Подборка · ${movie.title}`,
  };
}

/**
 * Отдельная ценность продукта: киномарафон после Challenge.
 * Данные = Movie.recommendations (без AI).
 */
export default async function MovieRecommendationsPage({
  params,
}: MovieRecommendationsPageProps) {
  const { slug } = await params;
  const movie = getMovieBySlug(slug);
  if (!movie) notFound();

  const categories = resolveMovieRecommendations(movie);
  if (categories.length === 0) notFound();

  return (
    <Container className="max-w-lg py-6">
      <MovieCollectionsView
        movieTitle={movie.title || movie.titleOriginal || slug}
        categories={categories}
      />
    </Container>
  );
}
