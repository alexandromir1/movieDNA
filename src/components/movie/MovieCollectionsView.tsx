"use client";

import { useRouter } from "next/navigation";

import type { MovieRecommendationItemView } from "@/types/recommendations";
import { GAME_ROUTES } from "@/lib/game/constants";

function MovieCard({ item }: { item: MovieRecommendationItemView }) {
  return (
    <li className="rounded-[12px] border border-white/[0.08] bg-white/[0.03] px-3.5 py-3">
      <p className="text-sm font-medium text-white">
        {item.title}
        {item.year > 0 ? (
          <span className="ml-1.5 font-normal text-white/35">{item.year}</span>
        ) : null}
      </p>
      {item.titleOriginal && item.titleOriginal !== item.title && (
        <p className="mt-0.5 text-xs text-white/40">{item.titleOriginal}</p>
      )}
      {item.note && (
        <p className="mt-1 text-xs leading-snug text-white/50">{item.note}</p>
      )}
    </li>
  );
}

interface MovieCollectionsViewProps {
  movieTitle: string;
  categories: Array<{ title: string; items: MovieRecommendationItemView[] }>;
}

/**
 * Киномарафон = что посмотреть, не во что играть.
 * Назад — к результату (history), без лишнего шага в меню.
 */
export function MovieCollectionsView({
  movieTitle,
  categories,
}: MovieCollectionsViewProps) {
  const router = useRouter();

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(GAME_ROUTES.today);
  }

  return (
    <div className="mx-auto w-full max-w-md pb-10">
      <button
        type="button"
        onClick={handleBack}
        className="text-xs text-white/40 underline-offset-2 hover:text-white/70 hover:underline"
      >
        ← Назад к результату
      </button>

      <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/35">
        Киномарафон
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
        Если понравился «{movieTitle}»
      </h1>
      <p className="mt-2 text-sm text-white/45">
        Подборка фильмов по разным категориям
      </p>

      <div className="mt-8 space-y-7">
        {categories.map((category) => (
          <section key={category.title}>
            <h2 className="text-sm font-medium text-white/85">{category.title}</h2>
            <ul className="mt-2.5 space-y-2.5">
              {category.items.map((item) => (
                <MovieCard
                  key={`${category.title}-${item.movieId}`}
                  item={item}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
