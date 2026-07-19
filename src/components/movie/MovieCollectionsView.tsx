"use client";

import { useRouter } from "next/navigation";

import type { MovieRecommendationItemView } from "@/types/recommendations";
import { GAME_ROUTES } from "@/lib/game/constants";
import { localize } from "@/lib/i18n/localize";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { LocalizedString } from "@/lib/i18n/types";

function MovieCard({ item }: { item: MovieRecommendationItemView }) {
  const { locale } = useLocale();
  const title = localize(item.title, locale);
  const note = item.note ? localize(item.note, locale) : null;

  return (
    <li className="rounded-[12px] border border-white/[0.08] bg-white/[0.03] px-3.5 py-3">
      <p className="text-sm font-medium text-white">
        {title}
        {item.year > 0 ? (
          <span className="ml-1.5 font-normal text-white/35">{item.year}</span>
        ) : null}
      </p>
      {note ? (
        <p className="mt-1 text-xs leading-snug text-white/50">{note}</p>
      ) : null}
    </li>
  );
}

interface MovieCollectionsViewProps {
  movieTitle: LocalizedString;
  categories: Array<{
    title: LocalizedString | string;
    items: MovieRecommendationItemView[];
  }>;
}

/**
 * Киномарафон: только язык UI, без второй строки на другом языке.
 */
export function MovieCollectionsView({
  movieTitle,
  categories,
}: MovieCollectionsViewProps) {
  const { locale, t } = useLocale();
  const router = useRouter();
  const primaryTitle = localize(movieTitle, locale);

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
        {t("collections.back")}
      </button>

      <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/35">
        {t("collections.title")}
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
        {t("collections.ifLiked", { title: primaryTitle })}
      </h1>
      <p className="mt-2 text-sm text-white/45">{t("collections.subtitle")}</p>

      <div className="mt-8 space-y-7">
        {categories.map((category) => {
          const categoryTitle = localize(category.title, locale);
          return (
            <section key={categoryTitle}>
              <h2 className="text-sm font-medium text-white/85">
                {categoryTitle}
              </h2>
              <ul className="mt-2.5 space-y-2.5">
                {category.items.map((item) => (
                  <MovieCard
                    key={`${categoryTitle}-${item.movieId}`}
                    item={item}
                  />
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
