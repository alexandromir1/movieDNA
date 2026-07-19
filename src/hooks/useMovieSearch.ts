"use client";

import { useEffect, useState } from "react";

import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { MovieSuggestion } from "@/types/game";

const DEBOUNCE_MS = 180;

export function useMovieSearch(query: string) {
  const { locale } = useLocale();
  const [suggestions, setSuggestions] = useState<MovieSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsLoading(true);

      try {
        const response = await fetch(
          `/api/movies/search?q=${encodeURIComponent(trimmed)}&locale=${locale}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          setSuggestions([]);
          return;
        }

        const data = (await response.json()) as { movies: MovieSuggestion[] };
        setSuggestions(data.movies ?? []);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSuggestions([]);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, locale]);

  return { suggestions, isLoading };
}
