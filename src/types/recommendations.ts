import type { LocalizedString } from "@/lib/i18n/types";

/** View-model для UI подборок — сырые локализованные поля, UI выбирает язык. */

export interface MovieRecommendationItemView {
  movieId: string;
  slug: string;
  title: LocalizedString;
  year: number;
  note: LocalizedString | string | null;
}

export interface MovieRecommendationCategoryView {
  title: LocalizedString | string;
  items: MovieRecommendationItemView[];
}
