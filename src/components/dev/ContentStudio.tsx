"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

import { ChallengeWizard } from "@/components/dev/ChallengeWizard";
import { ContentQueue } from "@/components/dev/ContentQueue";
import { ProgressiveRevealDemo } from "@/components/test/ProgressiveRevealDemo";

import type {
  ContentStudioData,
  StudioChallengeRow,
  StudioLevelRow,
  StudioMovieRow,
} from "@/lib/dev/content-library";
import type { ChallengeStatus } from "@/types/content";
import type { RevealImageConfig } from "@/types/reveal-image";

type StudioSection =
  | "movies"
  | "levels"
  | "challenges"
  | "queue"
  | "archive";

interface ContentStudioProps {
  data: ContentStudioData;
  initialLevelSlug?: string;
  initialSection?: StudioSection;
}

const SECTIONS: Array<{ id: StudioSection; label: string }> = [
  { id: "queue", label: "Content Queue" },
  { id: "levels", label: "Levels" },
  { id: "movies", label: "Movies" },
  { id: "challenges", label: "Challenges" },
  { id: "archive", label: "Archive" },
];

const STATUS_OPTIONS: ChallengeStatus[] = ["draft", "ready", "scheduled"];

function toRevealConfig(level: StudioLevelRow): RevealImageConfig {
  return {
    image: level.level.image,
    width: level.level.width,
    height: level.level.height,
    regions: (level.level.revealRegions ?? [])
      .filter((region) => region.kind !== "full_image")
      .map((region) => ({
        id: region.id,
        label: region.name,
        points: region.polygon,
      })),
  };
}

function statusTone(status: string): string {
  if (status === "scheduled") return "border-sky-400/40 text-sky-200";
  if (status === "ready") return "border-emerald-400/40 text-emerald-200";
  return "border-amber-400/40 text-amber-200";
}

function bucketLabel(bucket: string | null): string {
  if (bucket === "today") return "Today";
  if (bucket === "upcoming") return "Upcoming";
  if (bucket === "archive") return "Archive";
  return "—";
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
}: {
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className="w-full border border-white/15 bg-black/50 px-2.5 py-1.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/35"
    />
  );
}

function SaveButton({
  busy,
  label = "Сохранить",
  onClick,
}: {
  busy: boolean;
  label?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      className="border border-white/25 bg-white/10 px-3 py-1.5 text-xs text-white transition-colors hover:bg-white/15 disabled:opacity-40"
    >
      {busy ? "…" : label}
    </button>
  );
}

function MovieEditor({
  row,
  onSaved,
}: {
  row: StudioMovieRow;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(row.movie.title);
  const [titleOriginal, setTitleOriginal] = useState(
    row.movie.titleOriginal ?? "",
  );
  const [year, setYear] = useState(
    row.movie.year > 0 ? String(row.movie.year) : "",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setTitle(row.movie.title);
    setTitleOriginal(row.movie.titleOriginal ?? "");
    setYear(row.movie.year > 0 ? String(row.movie.year) : "");
    setMessage(null);
  }, [row.movie, row.slug]);

  async function save() {
    setBusy(true);
    setMessage(null);
    try {
      await postContent({
        action: "movie",
        slug: row.slug,
        title,
        titleOriginal,
        year: Number(year),
      });
      setMessage("Сохранено");
      onSaved();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 border-t border-white/5 px-4 py-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <FieldLabel>Title (RU)</FieldLabel>
          <TextInput value={title} onChange={setTitle} placeholder="Шоу Трумана" />
        </div>
        <div>
          <FieldLabel>Title original (EN)</FieldLabel>
          <TextInput
            value={titleOriginal}
            onChange={setTitleOriginal}
            placeholder="The Truman Show"
          />
        </div>
        <div>
          <FieldLabel>Year</FieldLabel>
          <TextInput
            value={year}
            onChange={setYear}
            type="number"
            placeholder="1998"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <SaveButton busy={busy} onClick={() => void save()} />
        {message && (
          <span className="text-xs text-white/45">{message}</span>
        )}
      </div>
    </div>
  );
}

function LevelMetaEditor({
  active,
  onSaved,
}: {
  active: StudioLevelRow;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(active.movie?.title ?? "");
  const [titleOriginal, setTitleOriginal] = useState(
    active.movie?.titleOriginal ?? "",
  );
  const [year, setYear] = useState(
    active.movie && active.movie.year > 0 ? String(active.movie.year) : "",
  );
  const [answersText, setAnswersText] = useState(
    (active.level.acceptedAnswers ?? []).join("\n"),
  );
  const [status, setStatus] = useState<ChallengeStatus>(
    active.challenge?.status ?? "draft",
  );
  const [date, setDate] = useState(active.challenge?.date ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setTitle(active.movie?.title ?? "");
    setTitleOriginal(active.movie?.titleOriginal ?? "");
    setYear(
      active.movie && active.movie.year > 0 ? String(active.movie.year) : "",
    );
    setAnswersText((active.level.acceptedAnswers ?? []).join("\n"));
    setStatus(active.challenge?.status ?? "draft");
    setDate(active.challenge?.date ?? "");
    setMessage(null);
  }, [active]);

  async function saveAll() {
    setBusy(true);
    setMessage(null);
    try {
      await postContent({
        action: "movie",
        slug: active.slug,
        title,
        titleOriginal,
        year: Number(year),
      });
      await postContent({
        action: "answers",
        slug: active.slug,
        acceptedAnswers: answersText
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
      });
      if (active.challenge) {
        await postContent({
          action: "challenge",
          slug: active.slug,
          status,
          date,
        });
      }
      setMessage("Сохранено на диск");
      onSaved();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 border-b border-white/10 px-4 py-4">
      <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">
        Movie · Answers · Publish
      </p>

      <div className="space-y-2">
        <div>
          <FieldLabel>Title (RU)</FieldLabel>
          <TextInput value={title} onChange={setTitle} />
        </div>
        <div>
          <FieldLabel>Title original</FieldLabel>
          <TextInput value={titleOriginal} onChange={setTitleOriginal} />
        </div>
        <div>
          <FieldLabel>Year</FieldLabel>
          <TextInput value={year} onChange={setYear} type="number" />
        </div>
      </div>

      <div>
        <FieldLabel>Accepted answers (по одному на строку)</FieldLabel>
        <textarea
          value={answersText}
          onChange={(event) => setAnswersText(event.target.value)}
          rows={3}
          className="w-full border border-white/15 bg-black/50 px-2.5 py-1.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/35"
          placeholder={"Шоу Трумана\nThe Truman Show"}
        />
      </div>

      {active.challenge ? (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <FieldLabel>Status</FieldLabel>
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
      ) : (
        <p className="text-xs text-amber-200/70">
          Challenge JSON отсутствует для этого level
        </p>
      )}

      <div className="flex items-center gap-3">
        <SaveButton
          busy={busy}
          label="Сохранить метаданные"
          onClick={() => void saveAll()}
        />
        {message && (
          <span className="text-xs text-white/45">{message}</span>
        )}
      </div>
    </div>
  );
}

function ChallengeEditorRow({
  row,
  onSaved,
}: {
  row: StudioChallengeRow;
  onSaved: () => void;
}) {
  const [status, setStatus] = useState<ChallengeStatus>(row.status);
  const [date, setDate] = useState(row.publishAt);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setStatus(row.status);
    setDate(row.publishAt);
    setMessage(null);
  }, [row]);

  async function save() {
    setBusy(true);
    setMessage(null);
    try {
      await postContent({
        action: "challenge",
        slug: row.slug,
        status,
        date,
      });
      setMessage("ok");
      onSaved();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "err");
    } finally {
      setBusy(false);
    }
  }

  return (
    <tr className="border-b border-white/5 text-white/70">
      <td className="px-4 py-3">
        <input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className="border border-white/15 bg-black/50 px-2 py-1 font-mono text-xs text-white outline-none focus:border-white/35"
        />
      </td>
      <td className="px-4 py-3 text-white">{row.label}</td>
      <td className="px-4 py-3">
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as ChallengeStatus)}
          className={`border bg-black/50 px-2 py-1 text-xs outline-none ${statusTone(status)}`}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3 text-white/50">{bucketLabel(row.bucket)}</td>
      <td className="px-4 py-3 font-mono text-xs text-white/40">{row.slug}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <SaveButton busy={busy} label="Save" onClick={() => void save()} />
          {message && (
            <span className="text-[10px] text-white/40">{message}</span>
          )}
        </div>
      </td>
    </tr>
  );
}

function ChallengeTable({
  rows,
  empty,
  onSaved,
  editable = false,
}: {
  rows: StudioChallengeRow[];
  empty: string;
  onSaved?: () => void;
  editable?: boolean;
}) {
  if (rows.length === 0) {
    return <p className="px-4 py-8 text-sm text-white/35">{empty}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-white/10 text-[10px] uppercase tracking-wider text-white/30">
          <tr>
            <th className="px-4 py-3 font-medium">Publish date</th>
            <th className="px-4 py-3 font-medium">Movie</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Bucket</th>
            <th className="px-4 py-3 font-medium">Slug</th>
            {editable && <th className="px-4 py-3 font-medium"> </th>}
          </tr>
        </thead>
        <tbody>
          {editable && onSaved
            ? rows.map((row) => (
                <ChallengeEditorRow
                  key={row.challenge.id}
                  row={row}
                  onSaved={onSaved}
                />
              ))
            : rows.map((row) => (
                <tr
                  key={row.challenge.id}
                  className="border-b border-white/5 text-white/70"
                >
                  <td className="px-4 py-3 font-mono text-xs">
                    {row.publishAt}
                  </td>
                  <td className="px-4 py-3 text-white">{row.label}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block border px-2 py-0.5 text-xs ${statusTone(row.status)}`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/50">
                    {bucketLabel(row.bucket)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-white/40">
                    {row.slug}
                  </td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}

export function ContentStudio({
  data,
  initialLevelSlug,
  initialSection = "queue",
}: ContentStudioProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [section, setSection] = useState<StudioSection>(initialSection);
  const [activeSlug, setActiveSlug] = useState(
    initialLevelSlug && data.levels.some((item) => item.slug === initialLevelSlug)
      ? initialLevelSlug
      : data.levels[0]?.slug ?? "",
  );
  const [liveAreaCount, setLiveAreaCount] = useState<number | null>(null);
  const [liveHasFull, setLiveHasFull] = useState<boolean | null>(null);
  const [expandedMovie, setExpandedMovie] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  const refresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const openLevel = (slug: string) => {
    setActiveSlug(slug);
    setSection("levels");
  };

  const active = useMemo(
    () => data.levels.find((item) => item.slug === activeSlug) ?? data.levels[0],
    [activeSlug, data.levels],
  );

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("section", section);
    if (section === "levels" && activeSlug) {
      url.searchParams.set("level", activeSlug);
    }
    window.history.replaceState({}, "", url.toString());
  }, [section, activeSlug]);

  useEffect(() => {
    setLiveAreaCount(null);
    setLiveHasFull(null);
  }, [activeSlug]);

  const areaCount = liveAreaCount ?? active?.areaRegionCount ?? 0;
  const hasFull = liveHasFull ?? active?.hasFullReveal ?? false;

  const liveChecklist = (active?.checklist ?? []).map((item) => {
    if (item.id === "regions") {
      return {
        ...item,
        done: areaCount >= 4,
        label: `Reveal Regions созданы (${areaCount}/4 area)`,
      };
    }
    if (item.id === "full") return { ...item, done: hasFull };
    if (item.id === "ready") {
      const othersOk = (active?.checklist ?? [])
        .filter(
          (entry) =>
            entry.id !== "regions" &&
            entry.id !== "ready" &&
            entry.id !== "full",
        )
        .every((entry) => entry.done);
      return { ...item, done: areaCount >= 4 && othersOk && hasFull };
    }
    return item;
  });

  return (
    <div className="mx-auto w-full max-w-7xl px-3 py-6 lg:px-6">
      {wizardOpen && (
        <ChallengeWizard
          movies={data.movies}
          today={data.today}
          onClose={() => {
            setWizardOpen(false);
            if (activeSlug) {
              setSection("levels");
            }
          }}
          onLevelReady={(slug) => setActiveSlug(slug)}
          onFinished={(slug) => {
            setWizardOpen(false);
            setActiveSlug(slug);
            setSection("queue");
            refresh();
          }}
          onRefresh={refresh}
        />
      )}

      <div className="mb-5 flex flex-col gap-3 border border-white/10 bg-black/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">
            Today (UTC) · {data.today}
          </p>
          <p className="mt-1 text-sm text-white/75">
            {data.todayChallenge ? (
              <>
                Today&apos;s Challenge:{" "}
                <span className="text-white">{data.todayChallenge.label}</span>
              </>
            ) : (
              <span className="text-white/40">
                На сегодня нет scheduled Challenge — поставь дату = {data.today}
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setWizardOpen(true)}
          className="shrink-0 border border-white/30 bg-white/10 px-4 py-2 text-xs text-white transition-colors hover:bg-white/15"
        >
          + Import Image
        </button>
      </div>

      <nav className="mb-5 flex flex-wrap gap-2 border-b border-white/10 pb-3">
        {SECTIONS.map((item) => {
          const count =
            item.id === "movies"
              ? data.movies.length
              : item.id === "levels"
                ? data.levels.length
                : item.id === "challenges"
                  ? data.challenges.length
                  : item.id === "queue"
                    ? data.levels.length
                    : data.archive.length;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={`border px-3 py-1.5 text-xs transition-colors ${
                section === item.id
                  ? "border-white/40 bg-white/10 text-white"
                  : "border-white/10 text-white/45 hover:border-white/25 hover:text-white/70"
              }`}
            >
              {item.label}
              <span className="ml-2 text-white/30">{count}</span>
            </button>
          );
        })}
      </nav>

      {section === "movies" && (
        <section className="border border-white/10 bg-black/30">
          <div className="border-b border-white/10 px-4 py-3">
            <h2 className="text-sm text-white">Movies</h2>
            <p className="mt-1 text-xs text-white/35">
              Редактируй title / original / year прямо здесь — пишется в{" "}
              <code className="text-white/50">data/movies/*.json</code>
            </p>
          </div>
          <ul className="divide-y divide-white/5">
            {data.movies.map((row) => {
              const open = expandedMovie === row.slug;
              return (
                <li key={row.slug}>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedMovie(open ? null : row.slug)
                    }
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm hover:bg-white/5"
                  >
                    <div>
                      <p className="text-white">{row.label}</p>
                      <p className="font-mono text-xs text-white/35">
                        {row.slug}
                      </p>
                    </div>
                    <span
                      className={`text-xs ${row.filled ? "text-emerald-300" : "text-amber-200/80"}`}
                    >
                      {row.filled ? "Filled" : "Needs titles"} ·{" "}
                      {open ? "свернуть" : "править"}
                    </span>
                  </button>
                  {open && <MovieEditor row={row} onSaved={refresh} />}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {section === "levels" && active && (
        <div className="flex flex-col gap-4 lg:flex-row">
          <aside className="w-full shrink-0 border border-white/10 bg-black/40 lg:w-52">
            <div className="border-b border-white/10 px-3 py-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">
                Levels
              </p>
            </div>
            <ul className="max-h-[28rem] overflow-y-auto py-1">
              {data.levels.map((item) => {
                const selected = item.slug === active.slug;
                return (
                  <li key={item.slug}>
                    <button
                      type="button"
                      onClick={() => setActiveSlug(item.slug)}
                      className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm ${
                        selected
                          ? "bg-white/10 text-white"
                          : "text-white/55 hover:bg-white/5 hover:text-white/80"
                      }`}
                    >
                      <span className="min-w-0 truncate">
                        <span className="block truncate">{item.label}</span>
                        {item.challenge?.date && (
                          <span className="block font-mono text-[10px] text-white/30">
                            {item.challenge.date}
                          </span>
                        )}
                      </span>
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                          item.readyForSchedule
                            ? "bg-emerald-400"
                            : "bg-white/20"
                        }`}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          <main className="min-w-0 flex-1">
            <ProgressiveRevealDemo
              key={active.slug}
              config={toRevealConfig(active)}
              configFilename={`levels/${active.slug}.json`}
              levelSlug={active.slug}
              onRegionsChange={(count) => setLiveAreaCount(count)}
              onSaveSuccess={() => {
                setLiveHasFull(true);
                refresh();
              }}
            />
          </main>

          <aside className="w-full shrink-0 border border-white/10 bg-black/40 lg:w-80">
            <div className="border-b border-white/10 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">
                Level Info
              </p>
              <h2 className="mt-2 text-base text-white">{active.label}</h2>
              <p className="mt-1 text-xs text-white/40">
                {active.level.width}×{active.level.height} · {areaCount} area
                {hasFull ? " + full" : ""}
              </p>
            </div>

            <LevelMetaEditor active={active} onSaved={refresh} />

            <div className="px-4 py-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">
                Quality Checklist
              </p>
              <ul className="mt-3 space-y-2">
                {liveChecklist.map((item) => (
                  <li
                    key={item.id}
                    className={`flex items-start gap-2 text-xs ${
                      item.done ? "text-emerald-300/90" : "text-white/40"
                    }`}
                  >
                    <span className="mt-0.5 font-mono">
                      {item.done ? "☑" : "☐"}
                    </span>
                    <span>{item.label}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[11px] leading-relaxed text-white/30">
                Сохрани метаданные справа → checklist зелёный → status{" "}
                <code className="text-white/45">scheduled</code> + дата. В прод
                — commit/push JSON.
              </p>
            </div>
          </aside>
        </div>
      )}

      {section === "challenges" && (
        <section className="border border-white/10 bg-black/30">
          <div className="border-b border-white/10 px-4 py-3">
            <h2 className="text-sm text-white">Challenges</h2>
            <p className="mt-1 text-xs text-white/35">
              Меняй status и дату здесь. draft → ready → scheduled.
            </p>
          </div>
          <ChallengeTable
            rows={data.challenges}
            empty="Нет challenges в data/challenges"
            editable
            onSaved={refresh}
          />
        </section>
      )}

      {section === "queue" && (
        <div className="space-y-4">
          <section className="border border-white/10 bg-black/30">
            <div className="border-b border-white/10 px-4 py-3">
              <h2 className="text-sm text-white">Content Queue</h2>
              <p className="mt-1 text-xs text-white/35">
                Pipeline: Image → Regions → Answers → Schedule. Клик по строке
                открывает Reveal Editor.
              </p>
            </div>
            <ContentQueue levels={data.levels} onOpenLevel={openLevel} />
          </section>

          <section className="border border-white/10 bg-black/30">
            <div className="border-b border-white/10 px-4 py-3">
              <h2 className="text-sm text-white">Schedule · Upcoming</h2>
              <p className="mt-1 text-xs text-white/35">
                scheduled + publishAt &gt; today
              </p>
            </div>
            <ChallengeTable
              rows={data.upcoming}
              empty="Очередь пуста — назначь даты будущим Challenge"
            />
          </section>

          <section className="border border-white/10 bg-black/30">
            <div className="border-b border-white/10 px-4 py-3">
              <h2 className="text-sm text-white">Ready · не в расписании</h2>
            </div>
            <ChallengeTable
              rows={data.readyUnscheduled}
              empty="Нет ready Challenge"
            />
          </section>

          <section className="border border-white/10 bg-black/30">
            <div className="border-b border-white/10 px-4 py-3">
              <h2 className="text-sm text-white">Drafts</h2>
            </div>
            <ChallengeTable rows={data.drafts} empty="Нет черновиков" />
          </section>
        </div>
      )}

      {section === "archive" && (
        <section className="border border-white/10 bg-black/30">
          <div className="border-b border-white/10 px-4 py-3">
            <h2 className="text-sm text-white">Archive</h2>
            <p className="mt-1 text-xs text-white/35">
              scheduled + publishAt &lt; today — прошлые Daily Challenge
            </p>
          </div>
          <ChallengeTable
            rows={data.archive}
            empty="Архив пуст — прошедшие даты появятся здесь автоматически"
          />
        </section>
      )}
    </div>
  );
}
