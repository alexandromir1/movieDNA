/** View-model для UI подборок — только «что посмотреть», без игры. */

export interface MovieRecommendationItemView {
  movieId: string;
  slug: string;
  title: string;
  titleOriginal: string | null;
  year: number;
  note: string | null;
}

export interface MovieRecommendationCategoryView {
  title: string;
  items: MovieRecommendationItemView[];
}
