"use client";

import { useEffect, useId, useRef, useState } from "react";

import { formatMovieLabel } from "@/lib/game/movie-search";
import { useTranslations } from "@/lib/i18n/LocaleProvider";
import { cn } from "@/lib/utils/cn";
import { useMovieSearch } from "@/hooks/useMovieSearch";
import { analytics } from "@/analytics";
import type { MovieSuggestion } from "@/types/game";

interface MovieSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  /** Подсветка ошибки ввода */
  isError?: boolean;
  /** Скрыть встроенную кнопку — родитель рисует CTA сам */
  hideSubmitButton?: boolean;
  /** После выбора из списка (mobile ghost-click guard у родителя) */
  onSuggestionSelect?: () => void;
  /** Доп. классы для input (презентация v2 и т.п.) */
  inputClassName?: string;
  /**
   * Presentation only.
   * `overlay` — абсолютный список (default, desktop/v1).
   * `flow` — на mobile список в потоке под полем; desktop остаётся overlay.
   */
  suggestionsPlacement?: "overlay" | "flow";
}

export function MovieSearchInput({
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder,
  isError = false,
  hideSubmitButton = false,
  onSuggestionSelect,
  inputClassName,
  suggestionsPlacement = "overlay",
}: MovieSearchInputProps) {
  const t = useTranslations();
  const resolvedPlaceholder = placeholder ?? t("game.searchPlaceholder");
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  /** Не открывать список сразу после выбора пункта (focus/blur гонки на mobile) */
  const skipOpenRef = useRef(false);
  const flowPlacement = suggestionsPlacement === "flow";

  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const { suggestions, isLoading } = useMovieSearch(value);

  useEffect(() => {
    setActiveIndex(suggestions.length > 0 ? 0 : -1);
  }, [value, suggestions.length]);

  useEffect(() => {
    if (disabled || isError) {
      setIsOpen(false);
    }
  }, [disabled, isError]);

  useEffect(() => {
    if (!value.trim()) {
      setIsOpen(false);
    }
  }, [value]);

  useEffect(() => {
    function handlePointerDownOutside(event: PointerEvent) {
      const target = event.target as Node | null;
      if (!target || !containerRef.current) return;
      if (!containerRef.current.contains(target)) {
        setIsOpen(false);
      }
    }

    // pointerdown ловит и мышь, и touch — надёжнее mousedown на мобилках
    document.addEventListener("pointerdown", handlePointerDownOutside, true);
    return () => {
      document.removeEventListener(
        "pointerdown",
        handlePointerDownOutside,
        true,
      );
    };
  }, []);

  function openIfAllowed() {
    if (skipOpenRef.current) return;
    if (disabled || isError) return;
    if (!value.trim()) return;
    setIsOpen(true);
  }

  function selectSuggestion(movie: MovieSuggestion) {
    skipOpenRef.current = true;
    analytics.track("search_used", {
      queryLength: value.length,
      resultsCount: suggestions.length,
      selectedMovieId: movie.id,
      selectedMovieTitle: movie.title,
      selectedMovieYear: movie.year > 0 ? movie.year : undefined,
    });
    onSuggestionSelect?.();
    onChange(movie.title);
    setIsOpen(false);
    // Не blur — иначе на mobile клавиатура/скролл «убегают» вместе со строкой.
    // Фокус оставляем; список закрыт.
    window.setTimeout(() => {
      skipOpenRef.current = false;
    }, 400);
  }

  function handleSubmit() {
    setIsOpen(false);
    skipOpenRef.current = true;
    onSuggestionSelect?.();
    onSubmit(value);
    // blur только при явной отправке ответа
    inputRef.current?.blur();
    window.setTimeout(() => {
      skipOpenRef.current = false;
    }, 400);
  }

  const showDropdown =
    isOpen &&
    value.trim().length > 0 &&
    !disabled &&
    !isError &&
    (suggestions.length > 0 || isLoading);

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full", flowPlacement && "v2-search-flow")}
    >
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={Boolean(showDropdown && suggestions.length > 0)}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-busy={isLoading}
          aria-invalid={isError}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          enterKeyHint="done"
          value={value}
          disabled={disabled}
          placeholder={resolvedPlaceholder}
          className={cn(
            "w-full rounded-[10px] border bg-white/[0.03] px-3 py-2.5 text-center text-base outline-none transition-[border-color,background-color] duration-300 sm:px-4 sm:py-3",
            "disabled:cursor-not-allowed disabled:opacity-40",
            isError
              ? "border-rose-400/50 text-rose-200/90 placeholder:text-rose-200/35"
              : "border-white/[0.12] text-white placeholder:text-white/30 focus:border-white/35 focus:bg-white/[0.05]",
            inputClassName,
          )}
          onChange={(event) => {
            skipOpenRef.current = false;
            onChange(event.target.value);
            if (event.target.value.trim()) {
              setIsOpen(true);
            } else {
              setIsOpen(false);
            }
          }}
          onFocus={() => {
            openIfAllowed();
          }}
          onBlur={() => {
            // Даём время pointer/click по option; иначе список исчезнет до выбора
            window.setTimeout(() => {
              if (skipOpenRef.current) return;
              const active = document.activeElement;
              if (active && containerRef.current?.contains(active)) return;
              setIsOpen(false);
            }, 220);
          }}
          onKeyDown={(event) => {
            if (!isOpen || suggestions.length === 0) {
              if (event.key === "Enter") {
                event.preventDefault();
                handleSubmit();
              }
              return;
            }

            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((index) => (index + 1) % suggestions.length);
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((index) =>
                index <= 0 ? suggestions.length - 1 : index - 1,
              );
            } else if (event.key === "Enter") {
              event.preventDefault();
              if (activeIndex >= 0 && suggestions[activeIndex]) {
                selectSuggestion(suggestions[activeIndex]);
              } else {
                handleSubmit();
              }
            } else if (event.key === "Escape") {
              setIsOpen(false);
            }
          }}
        />
        {!hideSubmitButton && (
          <button
            type="submit"
            disabled={disabled || value.trim().length === 0}
            className={cn(
              "h-11 w-full rounded-[10px] bg-white text-sm font-medium text-black transition-all duration-200",
              "hover:bg-white/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30",
            )}
          >
            Проверить ответ
          </button>
        )}
      </form>

      {showDropdown && suggestions.length > 0 ? (
        <ul
          id={listboxId}
          role="listbox"
          className={cn(
            flowPlacement
              ? "v2-suggest-list"
              : "absolute left-0 right-0 top-full z-50 mt-2 max-h-48 overflow-y-auto overscroll-contain rounded-[12px] border border-white/[0.1] bg-[#1a1a1e] shadow-[0_16px_48px_rgb(0_0_0/0.5)]",
          )}
        >
          {suggestions.map((movie, index) => (
            <li
              key={movie.id}
              role="option"
              aria-selected={index === activeIndex}
              className={cn(
                "cursor-pointer px-4 py-3 text-sm text-white/80 transition-colors active:bg-white/15",
                flowPlacement && "v2-suggest-item",
                index === activeIndex && "bg-white/10 text-white",
                flowPlacement &&
                  index === activeIndex &&
                  "v2-suggest-item--active",
              )}
              onMouseEnter={() => setActiveIndex(index)}
              onPointerDown={(event) => {
                // Не даём input потерять фокус до выбора — иначе click теряется на iOS
                event.preventDefault();
                event.stopPropagation();
                selectSuggestion(movie);
              }}
              onClick={(event) => {
                // Страховка от ghost click / bubbling к кадру под списком
                event.preventDefault();
                event.stopPropagation();
              }}
            >
              {formatMovieLabel(movie)}
            </li>
          ))}
        </ul>
      ) : null}

      {!flowPlacement && showDropdown && isLoading && suggestions.length === 0 ? (
        <p className="absolute left-0 right-0 top-full mt-2 text-center text-xs text-white/25">
          Поиск...
        </p>
      ) : null}
    </div>
  );
}
