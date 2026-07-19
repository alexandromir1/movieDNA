"use client";

import { useEffect, useMemo, useState } from "react";

import { ProgressiveRevealDemo } from "@/components/test/ProgressiveRevealDemo";

import type { StudioMovieRow } from "@/lib/dev/content-library";
import { slugifyLevelSlug } from "@/lib/dev/slugify";
import { localize } from "@/lib/i18n/localize";
import type { LocalizedString } from "@/lib/i18n/types";
import type { ChallengeStatus } from "@/types/content";
import type { RevealImageConfig } from "@/types/reveal-image";

type WizardStep = 1 | 2 | 3 | 4 | 5;

const STEP_LABELS: Record<WizardStep, string> = {
  1: "Movie",
  2: "Image",
  3: "Reveal Regions",
  4: "Accepted Answers",
  5: "Schedule",
};

const STATUS_OPTIONS: ChallengeStatus[] = ["draft", "ready", "scheduled"];

interface CreatedLevelPreview {
  slug: string;
  image: string;
  width: number;
  height: number;
  label: string;
}

interface ChallengeWizardProps {
  movies: StudioMovieRow[];
  today: string;
  onClose: () => void;
  /** After Level exists — parent should track activeSlug for Reveal Editor */
  onLevelReady: (slug: string) => void;
  onFinished: (slug: string) => void;
  onRefresh: () => void;
}

async function postContent(body: Record<string, unknown>) {
  const response = await fetch("/api/dev/content", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await response.json()) as { error?: string };
  if (!response.ok) {
    throw new Error(json.error ?? `Save failed (${response.status})`);
  }
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1 block text-[10px] uppercase tracking-wider text-white/30">
      {children}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  type = "text",
  placeholder,
  readOnly = false,
}: {
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  readOnly?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      readOnly={readOnly}
      onChange={(event) => onChange(event.target.value)}
      className="w-full border border-white/15 bg-black/50 px-2.5 py-1.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/35 read-only:text-white/50"
    />
  );
}

export function ChallengeWizard({
  movies,
  today,
  onClose,
  onLevelReady,
  onFinished,
  onRefresh,
}: ChallengeWizardProps) {
  const [step, setStep] = useState<WizardStep>(1);
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [query, setQuery] = useState("");
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(
    movies[0]?.movie.id ?? null,
  );
  const [newTitle, setNewTitle] = useState("");
  const [newTitleOriginal, setNewTitleOriginal] = useState("");
  const [newYear, setNewYear] = useState("");
  const [slug, setSlug] = useState(movies[0]?.slug ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedLevelPreview | null>(null);
  const [answersText, setAnswersText] = useState("");
  const [status, setStatus] = useState<ChallengeStatus>("draft");
  const [date, setDate] = useState(today);

  const filteredMovies = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? movies.filter((row) => {
          const ru = localize(row.movie.title, "ru").toLowerCase();
          const en = localize(row.movie.title, "en").toLowerCase();
          return (
            row.label.toLowerCase().includes(q) ||
            row.slug.includes(q) ||
            ru.includes(q) ||
            en.includes(q)
          );
        })
      : movies;
    return base.slice(0, 40);
  }, [movies, query]);

  function suggestSlugFromFile(next: File) {
    const base = next.name.replace(/\.[^.]+$/, "");
    const nextSlug = slugifyLevelSlug(base);
    if (nextSlug) setSlug(nextSlug);
  }

  function applyExistingMovie(movieId: string) {
    setSelectedMovieId(movieId);
    const row = movies.find((item) => item.movie.id === movieId);
    if (row) setSlug(row.slug);
  }

  async function createLevel() {
    if (!file) {
      setError("Выбери изображение");
      return;
    }
    const nextSlug = slugifyLevelSlug(slug);
    if (!nextSlug) {
      setError("Некорректный slug");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("slug", nextSlug);
      form.set("file", file);
      if (mode === "existing" && selectedMovieId) {
        form.set("movieId", selectedMovieId);
      } else {
        form.set("title", newTitle);
        form.set("titleOriginal", newTitleOriginal || newTitle);
        form.set("year", newYear || "0");
      }

      const response = await fetch("/api/dev/create-level", {
        method: "POST",
        body: form,
      });
      const json = (await response.json()) as {
        error?: string;
        slug?: string;
        image?: string;
        width?: number;
        height?: number;
        movie?: { title?: LocalizedString | string };
      };
      if (!response.ok) {
        throw new Error(json.error ?? `Create failed (${response.status})`);
      }

      const preview: CreatedLevelPreview = {
        slug: json.slug!,
        image: json.image!,
        width: json.width!,
        height: json.height!,
        label:
          (json.movie?.title
            ? localize(json.movie.title, "ru") ||
              localize(json.movie.title, "en")
            : "") || json.slug!,
      };
      setCreated(preview);
      setSlug(preview.slug);
      onLevelReady(preview.slug);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка создания");
    } finally {
      setBusy(false);
    }
  }

  // After import: show Preview on step 2, then open Reveal Editor (never return to list).
  useEffect(() => {
    if (!created || step !== 2) return;
    const timer = window.setTimeout(() => setStep(3), 600);
    return () => window.clearTimeout(timer);
  }, [created, step]);

  async function saveAnswers() {
    if (!created) return;
    setBusy(true);
    setError(null);
    try {
      await postContent({
        action: "answers",
        slug: created.slug,
        acceptedAnswers: answersText
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
      });
      onRefresh();
      setStep(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  async function saveSchedule() {
    if (!created) return;
    setBusy(true);
    setError(null);
    try {
      await postContent({
        action: "challenge",
        slug: created.slug,
        status,
        date,
      });
      onRefresh();
      onFinished(created.slug);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  const revealConfig: RevealImageConfig | null = created
    ? {
        image: created.image,
        width: created.width,
        height: created.height,
        regions: [],
      }
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 px-3 py-6 backdrop-blur-sm">
      <div className="w-full max-w-5xl border border-white/15 bg-[#0a0a0a] shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/35">
              Challenge Wizard · Step {step}/5
            </p>
            <h2 className="mt-1 text-lg text-white">{STEP_LABELS[step]}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="border border-white/15 px-3 py-1.5 text-xs text-white/55 hover:border-white/30 hover:text-white"
          >
            Close
          </button>
        </header>

        <div className="flex flex-wrap gap-2 border-b border-white/10 px-5 py-3">
          {([1, 2, 3, 4, 5] as WizardStep[]).map((item) => (
            <span
              key={item}
              className={`border px-2 py-1 text-[10px] uppercase tracking-wider ${
                item === step
                  ? "border-white/40 text-white"
                  : item < step
                    ? "border-emerald-400/30 text-emerald-200/80"
                    : "border-white/10 text-white/30"
              }`}
            >
              {item}. {STEP_LABELS[item]}
            </span>
          ))}
        </div>

        <div className="px-5 py-5">
          {error && (
            <p className="mb-4 border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
              {error}
            </p>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode("existing")}
                  className={`border px-3 py-1.5 text-xs ${
                    mode === "existing"
                      ? "border-white/40 bg-white/10 text-white"
                      : "border-white/10 text-white/45"
                  }`}
                >
                  Existing Movie
                </button>
                <button
                  type="button"
                  onClick={() => setMode("new")}
                  className={`border px-3 py-1.5 text-xs ${
                    mode === "new"
                      ? "border-white/40 bg-white/10 text-white"
                      : "border-white/10 text-white/45"
                  }`}
                >
                  Create new Movie
                </button>
              </div>

              {mode === "existing" ? (
                <div className="space-y-3">
                  <div>
                    <FieldLabel>Search library</FieldLabel>
                    <TextInput
                      value={query}
                      onChange={setQuery}
                      placeholder="Joker, Matrix, Брат…"
                    />
                  </div>
                  <ul className="max-h-64 overflow-y-auto border border-white/10">
                    {filteredMovies.map((row) => {
                      const selected = selectedMovieId === row.movie.id;
                      return (
                        <li key={row.movie.id}>
                          <button
                            type="button"
                            onClick={() => applyExistingMovie(row.movie.id)}
                            className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm ${
                              selected
                                ? "bg-white/10 text-white"
                                : "text-white/60 hover:bg-white/5"
                            }`}
                          >
                            <span>
                              <span className="block">{row.label}</span>
                              <span className="font-mono text-[10px] text-white/30">
                                {row.slug}
                                {row.movie.year > 0 ? ` · ${row.movie.year}` : ""}
                              </span>
                            </span>
                            {selected && (
                              <span className="text-[10px] text-emerald-300">
                                selected
                              </span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  <div>
                    <FieldLabel>Level slug</FieldLabel>
                    <TextInput
                      value={slug}
                      onChange={() => undefined}
                      readOnly
                    />
                    <p className="mt-1 text-[11px] text-white/30">
                      Совпадает со slug Movie. Для другого slug — Duplicate Level
                      (следующий PR).
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <FieldLabel>Title (RU)</FieldLabel>
                      <TextInput value={newTitle} onChange={setNewTitle} />
                    </div>
                    <div>
                      <FieldLabel>Title original</FieldLabel>
                      <TextInput
                        value={newTitleOriginal}
                        onChange={setNewTitleOriginal}
                      />
                    </div>
                    <div>
                      <FieldLabel>Year</FieldLabel>
                      <TextInput
                        value={newYear}
                        onChange={setNewYear}
                        type="number"
                      />
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Level slug</FieldLabel>
                    <TextInput
                      value={slug}
                      onChange={setSlug}
                      placeholder="joker"
                    />
                    <p className="mt-1 text-[11px] text-white/30">
                      lowercase kebab-case · files: data/*/&#123;slug&#125;.json
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (mode === "existing" && !selectedMovieId) {
                      setError("Выбери Movie из библиотеки");
                      return;
                    }
                    if (mode === "new" && !newTitle.trim() && !newTitleOriginal.trim()) {
                      setError("Укажи название нового Movie");
                      return;
                    }
                    if (!slugifyLevelSlug(slug)) {
                      setError("Некорректный slug");
                      return;
                    }
                    setError(null);
                    setStep(2);
                  }}
                  className="border border-white/30 bg-white/10 px-4 py-2 text-xs text-white hover:bg-white/15"
                >
                  Next · Import Image
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              {!created ? (
                <>
                  <div>
                    <FieldLabel>Image file</FieldLabel>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                      onChange={(event) => {
                        const next = event.target.files?.[0] ?? null;
                        setFile(next);
                        if (next) suggestSlugFromFile(next);
                      }}
                      className="block w-full text-sm text-white/70 file:mr-3 file:border file:border-white/20 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:text-white"
                    />
                  </div>
                  <div>
                    <FieldLabel>Slug (confirm)</FieldLabel>
                    <TextInput value={slug} onChange={setSlug} />
                  </div>
                  <div className="flex justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="border border-white/15 px-3 py-2 text-xs text-white/50"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={busy || !file}
                      onClick={() => void createLevel()}
                      className="border border-white/30 bg-white/10 px-4 py-2 text-xs text-white hover:bg-white/15 disabled:opacity-40"
                    >
                      {busy ? "Creating…" : "Create Level"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="border border-white/10 bg-black/40 p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={created.image}
                      alt={created.label}
                      className="mx-auto max-h-[70vh] w-full object-contain"
                    />
                  </div>
                  <p className="text-center text-sm text-white/55">
                    {created.label} · {created.width}×{created.height} ·{" "}
                    <span className="font-mono text-white/40">{created.slug}</span>
                  </p>
                  <p className="text-center text-xs text-white/35">
                    Opening Reveal Editor…
                  </p>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="border border-emerald-400/40 bg-emerald-400/10 px-4 py-2 text-xs text-emerald-100 hover:bg-emerald-400/15"
                    >
                      Open Reveal Editor now
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {step === 3 && created && revealConfig && (
            <div className="space-y-4">
              <p className="text-xs text-white/40">
                Reveal Editor для{" "}
                <span className="font-mono text-white/60">{created.slug}</span>.
                Нарисуй ≥4 area-региона (D → Developer Mode) и сохрани JSON.
              </p>
              <ProgressiveRevealDemo
                key={created.slug}
                config={revealConfig}
                configFilename={`levels/${created.slug}.json`}
                levelSlug={created.slug}
                onSaveSuccess={() => onRefresh()}
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="border border-white/30 bg-white/10 px-4 py-2 text-xs text-white hover:bg-white/15"
                >
                  Next · Answers
                </button>
              </div>
            </div>
          )}

          {step === 4 && created && (
            <div className="space-y-4">
              <div>
                <FieldLabel>Accepted answers (one per line)</FieldLabel>
                <textarea
                  value={answersText}
                  onChange={(event) => setAnswersText(event.target.value)}
                  rows={5}
                  className="w-full border border-white/15 bg-black/50 px-2.5 py-1.5 text-sm text-white outline-none focus:border-white/35"
                  placeholder={"Джокер\nJoker"}
                />
              </div>
              <div className="flex justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="border border-white/15 px-3 py-2 text-xs text-white/50"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void saveAnswers()}
                  className="border border-white/30 bg-white/10 px-4 py-2 text-xs text-white hover:bg-white/15 disabled:opacity-40"
                >
                  {busy ? "Saving…" : "Save & Schedule"}
                </button>
              </div>
            </div>
          )}

          {step === 5 && created && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <FieldLabel>Challenge status</FieldLabel>
                  <select
                    value={status}
                    onChange={(event) =>
                      setStatus(event.target.value as ChallengeStatus)
                    }
                    className="w-full border border-white/15 bg-black/50 px-2 py-1.5 text-sm text-white outline-none focus:border-white/35"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel>Publish date (UTC)</FieldLabel>
                  <TextInput value={date} onChange={setDate} type="date" />
                </div>
              </div>
              <p className="text-xs text-white/35">
                draft → ready → scheduled. В игру попадает только{" "}
                <code className="text-white/50">scheduled</code>.
              </p>
              <div className="flex justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="border border-white/15 px-3 py-2 text-xs text-white/50"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void saveSchedule()}
                  className="border border-emerald-400/40 bg-emerald-400/10 px-4 py-2 text-xs text-emerald-100 hover:bg-emerald-400/15 disabled:opacity-40"
                >
                  {busy ? "Saving…" : "Done"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
