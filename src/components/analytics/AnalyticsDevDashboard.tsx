"use client";

import { useCallback, useEffect, useState } from "react";

import {
  buildAnalyticsDashboard,
  difficultyLabel,
  formatPercent,
  formatRegion,
  formatSeconds,
  type AnalyticsDashboardSummary,
  type DifficultyBand,
  type MovieMetricRow,
} from "@/analytics/dashboard";
import {
  clearAnalyticsEventLog,
  loadAnalyticsEventLog,
} from "@/analytics/local-store";
import { cn } from "@/lib/utils/cn";

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-[14px] border border-white/[0.08] bg-white/[0.03] px-4 py-3.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-white">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-white/35">{hint}</p> : null}
    </div>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[16px] border border-white/[0.08] bg-white/[0.02] p-4">
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      {hint ? <p className="mt-1 text-xs text-white/40">{hint}</p> : null}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function BarRow({
  label,
  share,
  count,
}: {
  label: string;
  share: number;
  count?: number;
}) {
  const pct = Math.round(share * 1000) / 10;
  const blocks = Math.max(0, Math.round(share * 12));
  const bar = "█".repeat(blocks) || "·";

  return (
    <div className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-2 text-sm">
      <span className="text-white/70">{label}</span>
      <span
        className="overflow-hidden font-mono text-[11px] tracking-tight text-[var(--accent)]"
        title={`${pct}%`}
      >
        {bar}
      </span>
      <span className="tabular-nums text-white/45">
        {pct}%{count != null ? ` · ${count}` : ""}
      </span>
    </div>
  );
}

function HeatDot({ band }: { band: DifficultyBand }) {
  return (
    <span
      className={cn(
        "inline-block h-2.5 w-2.5 rounded-full",
        band === "easy" && "bg-emerald-400",
        band === "normal" && "bg-amber-300",
        band === "hard" && "bg-rose-400",
        band === "unknown" && "bg-white/20",
      )}
      title={difficultyLabel(band)}
    />
  );
}

function MoviesDataTable({ rows }: { rows: MovieMetricRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-white/35">Пока нет данных по фильмам.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[36rem] text-left text-sm">
        <thead>
          <tr className="border-b border-white/[0.08] text-[10px] uppercase tracking-[0.18em] text-white/35">
            <th className="pb-2 pr-3 font-semibold">Фильм</th>
            <th className="pb-2 pr-3 font-semibold">Completion</th>
            <th className="pb-2 pr-3 font-semibold">Avg Regions</th>
            <th className="pb-2 pr-3 font-semibold">Avg Time</th>
            <th className="pb-2 font-semibold">Avg Attempts</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.06]">
          {rows.map((row) => (
            <tr key={row.movieKey}>
              <td className="py-2.5 pr-3">
                <span className="mr-2 inline-flex align-middle">
                  <HeatDot band={row.difficulty} />
                </span>
                <span className="font-medium text-white">{row.movieTitle}</span>
                {row.movieYear ? (
                  <span className="ml-1.5 text-white/35">{row.movieYear}</span>
                ) : null}
              </td>
              <td className="py-2.5 pr-3 tabular-nums text-white/75">
                {formatPercent(row.completionRate)}
              </td>
              <td className="py-2.5 pr-3 tabular-nums text-white/75">
                {row.avgRegions || "—"}
              </td>
              <td className="py-2.5 pr-3 tabular-nums text-white/75">
                {formatSeconds(row.avgSeconds)}
              </td>
              <td className="py-2.5 tabular-nums text-white/75">
                {row.avgAttempts || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Внутренний product dashboard — ответы на конкретные вопросы баланса.
 */
export function AnalyticsDevDashboard() {
  const [summary, setSummary] = useState<AnalyticsDashboardSummary | null>(
    null,
  );

  const refresh = useCallback(() => {
    setSummary(buildAnalyticsDashboard(loadAnalyticsEventLog()));
  }, []);

  useEffect(() => {
    refresh();
    const onUpdate = () => refresh();
    window.addEventListener("moviedna:analytics-log-updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("moviedna:analytics-log-updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, [refresh]);

  if (!summary) {
    return (
      <p className="py-10 text-center text-sm text-white/40">Loading…</p>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/35">
            Internal
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            Analytics
          </h1>
          <p className="mt-1.5 max-w-lg text-sm text-white/45">
            Какие Challenge переделать · где уходят · баланс сложности · что
            изменилось после апдейта. Локальный лог ({summary.eventCount}{" "}
            events).
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={refresh}
            className="rounded-[10px] border border-white/15 px-3 py-2 text-xs font-medium text-white/70 hover:bg-white/[0.05]"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={() => {
              clearAnalyticsEventLog();
              refresh();
            }}
            className="rounded-[10px] border border-white/10 px-3 py-2 text-xs font-medium text-white/40 hover:bg-white/[0.04]"
          >
            Clear log
          </button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <MetricCard
          label="Completion rate"
          value={formatPercent(summary.completionRate)}
          hint={`${summary.completed} won · ${summary.failed} failed · ${summary.abandoned} left`}
        />
        <MetricCard
          label="Average regions"
          value={
            summary.averageRegions != null
              ? String(summary.averageRegions)
              : "—"
          }
        />
        <MetricCard
          label="Average time"
          value={formatSeconds(summary.averageTimeSeconds)}
        />
        <MetricCard
          label="Average hints"
          value={
            summary.averageHints != null ? String(summary.averageHints) : "—"
          }
        />
        <MetricCard
          label="Average attempts"
          value={
            summary.averageAttempts != null
              ? String(summary.averageAttempts)
              : "—"
          }
        />
        <MetricCard
          label="Started"
          value={String(summary.started)}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Section
          title="Region distribution"
          hint="На каком числе регионов закончили Challenge (win/lose)."
        >
          {summary.regionDistribution.every((r) => r.count === 0) ? (
            <p className="text-sm text-white/35">Пока нет завершённых игр.</p>
          ) : (
            <div className="space-y-2">
              {summary.regionDistribution.map((row) => (
                <BarRow
                  key={row.regionIndex}
                  label={`Region ${row.regionIndex}`}
                  share={row.share}
                  count={row.count}
                />
              ))}
            </div>
          )}
        </Section>

        <Section
          title="Drop-off by region"
          hint="Сколько сессий дошло до открытия каждого региона."
        >
          {summary.dropOff[0]?.count === 0 ? (
            <p className="text-sm text-white/35">Пока нет стартов.</p>
          ) : (
            <ol className="space-y-2">
              {summary.dropOff.map((step, index) => (
                <li key={step.label} className="text-sm">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-white/80">{step.label}</span>
                    <span className="tabular-nums text-white/50">
                      {step.count}
                      <span className="ml-1.5 text-white/30">
                        {formatPercent(step.shareOfStarted)}
                      </span>
                    </span>
                  </div>
                  {index < summary.dropOff.length - 1 ? (
                    <p className="pl-1 text-white/20" aria-hidden>
                      ↓
                    </p>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
        </Section>
      </div>

      <div className="mt-4">
        <Section
          title="Movies"
          hint="🟢 easy · 🟡 normal · 🔴 too hard — проблемные Challenge сверху по смыслу таблицы."
        >
          <MoviesDataTable rows={summary.movies} />
        </Section>
      </div>

      <div className="mt-4">
        <Section
          title="Heatmap"
          hint="Одним взглядом: баланс коллекции."
        >
          {summary.movies.filter((m) => m.difficulty !== "unknown").length ===
          0 ? (
            <p className="text-sm text-white/35">Нужны завершённые Challenge.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {summary.movies
                .filter((m) => m.difficulty !== "unknown")
                .map((row) => (
                  <li
                    key={row.movieKey}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs",
                      row.difficulty === "easy" &&
                        "border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
                      row.difficulty === "normal" &&
                        "border-amber-300/30 bg-amber-300/10 text-amber-50",
                      row.difficulty === "hard" &&
                        "border-rose-400/30 bg-rose-400/10 text-rose-100",
                    )}
                  >
                    <HeatDot band={row.difficulty} />
                    {row.movieTitle}
                  </li>
                ))}
            </ul>
          )}
        </Section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Section
          title="Recognition vs Actual"
          hint="Поняли (самоотчёт) vs угадали (регионы при ответе). Большой разрыв = узнали раньше, чем рискнули."
        >
          {summary.recognitionVsActual.length === 0 ? (
            <p className="text-sm text-white/35">
              Нужны moment_of_recognition + победа на том же Challenge.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/[0.08] text-[10px] uppercase tracking-[0.18em] text-white/35">
                    <th className="pb-2 pr-3 font-semibold">Фильм</th>
                    <th className="pb-2 pr-3 font-semibold">Поняли</th>
                    <th className="pb-2 font-semibold">Угадали</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {summary.recognitionVsActual.map((row) => (
                    <tr key={row.movieKey}>
                      <td className="py-2.5 pr-3 font-medium text-white">
                        {row.movieTitle}
                      </td>
                      <td className="py-2.5 pr-3 tabular-nums text-white/75">
                        {formatRegion(row.avgRecognizedAt)}
                      </td>
                      <td className="py-2.5 tabular-nums text-white/75">
                        {formatRegion(row.avgGuessedAt)}
                        {row.recognitionGap != null &&
                        row.recognitionGap !== 0 ? (
                          <span className="ml-2 text-xs text-white/35">
                            gap {row.recognitionGap > 0 ? "+" : ""}
                            {row.recognitionGap}
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        <Section title="Most abandoned">
          {summary.mostAbandoned.length === 0 ? (
            <p className="text-sm text-white/35">Пока нет abandon.</p>
          ) : (
            <ul className="divide-y divide-white/[0.06]">
              {summary.mostAbandoned.map((row) => (
                <li
                  key={row.movieKey}
                  className="flex items-center justify-between gap-3 py-2.5 text-sm"
                >
                  <span className="text-white">{row.movieTitle}</span>
                  <span className="tabular-nums text-white/45">
                    {row.abandoned}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}
