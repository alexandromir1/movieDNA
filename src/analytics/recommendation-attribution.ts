const STORAGE_KEY = "moviedna-recommendation-attribution";
const MAX_AGE_MS = 30 * 60 * 1000;

export interface RecommendationAttribution {
  recommendedMovieId: string;
  recommendedMovieTitle: string;
  currentMovieId?: string;
  currentMovieTitle?: string;
  recommendationSection?: string;
  position?: number;
  recordedAt: number;
}

export function setRecommendationAttribution(
  attribution: Omit<RecommendationAttribution, "recordedAt">,
): void {
  if (typeof window === "undefined") return;

  try {
    const payload: RecommendationAttribution = {
      ...attribution,
      recordedAt: Date.now(),
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // private mode — attribution is best-effort
  }
}

/** Снимает атрибуцию один раз — для challenge_started после клика по рекомендации. */
export function consumeRecommendationAttribution(): RecommendationAttribution | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    sessionStorage.removeItem(STORAGE_KEY);
    const parsed = JSON.parse(raw) as RecommendationAttribution;
    if (
      !parsed?.recommendedMovieId ||
      !parsed.recommendedMovieTitle ||
      Date.now() - parsed.recordedAt > MAX_AGE_MS
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}
