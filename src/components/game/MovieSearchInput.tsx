"use client";

import { useEffect, useId, useRef, useState } from "react";

import { formatMovieLabel } from "@/lib/game/movie-search";
import { cn } from "@/lib/utils/cn";
import { useMovieSearch } from "@/hooks/useMovieSearch";

interface MovieSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MovieSearchInput({
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder = "Введите название фильма...",
}: MovieSearchInputProps) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const { suggestions, isLoading } = useMovieSearch(value);

  useEffect(() => {
    setActiveIndex(suggestions.length > 0 ? 0 : -1);
  }, [value, suggestions.length]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectSuggestion(title: string) {
    onChange(title);
    setIsOpen(false);
    inputRef.current?.focus();
  }

  function handleSubmit() {
    onSubmit(value);
    onChange("");
    setIsOpen(false);
  }

  const showDropdown = isOpen && value.trim().length > 0 && !disabled;

  return (
    <div ref={containerRef} className="relative w-full">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={showDropdown && suggestions.length > 0}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-busy={isLoading}
          autoComplete="off"
          spellCheck={false}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            "w-full border-0 border-b border-white/20 bg-transparent py-3 text-center text-base text-white",
            "placeholder:text-white/30 outline-none transition-colors",
            "focus:border-white/60 disabled:cursor-not-allowed disabled:opacity-40",
          )}
          onChange={(event) => {
            onChange(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(event) => {
            if (!showDropdown || suggestions.length === 0) {
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
              setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
            } else if (event.key === "Enter") {
              event.preventDefault();
              if (activeIndex >= 0) {
                selectSuggestion(suggestions[activeIndex].title);
              } else {
                handleSubmit();
              }
            } else if (event.key === "Escape") {
              setIsOpen(false);
            }
          }}
        />
      </form>

      {showDropdown && suggestions.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto border border-white/10 bg-[#1a1a1a] shadow-xl"
        >
          {suggestions.map((movie, index) => (
            <li
              key={movie.id}
              role="option"
              aria-selected={index === activeIndex}
              className={cn(
                "cursor-pointer px-4 py-2.5 text-sm text-white/80 transition-colors",
                index === activeIndex && "bg-white/10 text-white",
              )}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectSuggestion(movie.title)}
            >
              {formatMovieLabel(movie)}
            </li>
          ))}
        </ul>
      )}

      {showDropdown && isLoading && suggestions.length === 0 && (
        <p className="absolute left-0 right-0 top-full mt-2 text-center text-xs text-white/25">
          Поиск...
        </p>
      )}
    </div>
  );
}
