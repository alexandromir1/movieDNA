"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { ProgressiveRevealImage } from "@/components/ProgressiveRevealImage";

import type {
  ImageCoordinate,
  RevealImageConfig,
  RevealRegion,
} from "@/types/reveal-image";

interface ProgressiveRevealDemoProps {
  config: RevealImageConfig;
  configFilename?: string;
  /** Если задан — сохраняет регионы прямо в data/levels/{slug}.json */
  levelSlug?: string;
  /** Live-счётчик area-регионов для Quality Checklist */
  onRegionsChange?: (areaCount: number) => void;
  /** После успешного save в level JSON (full_image уже добавлен на сервере) */
  onSaveSuccess?: () => void;
}

const CLOSE_THRESHOLD = 18;
const SESSION_PREFIX = "moviedna-dev-regions:";

function distance(a: ImageCoordinate, b: ImageCoordinate): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9а-яё]+/gi, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "region"
  );
}

function sessionKey(levelSlug: string): string {
  return `${SESSION_PREFIX}${levelSlug}`;
}

function readSessionDraft(levelSlug: string | undefined): RevealRegion[] | null {
  if (!levelSlug || typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(sessionKey(levelSlug));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RevealRegion[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeSessionDraft(
  levelSlug: string | undefined,
  regions: RevealRegion[],
): void {
  if (!levelSlug || typeof window === "undefined") return;
  try {
    sessionStorage.setItem(sessionKey(levelSlug), JSON.stringify(regions));
  } catch {
    // ignore quota / private mode
  }
}

function clearSessionDraft(levelSlug: string | undefined): void {
  if (!levelSlug || typeof window === "undefined") return;
  sessionStorage.removeItem(sessionKey(levelSlug));
}

function initialRegions(
  config: RevealImageConfig,
  levelSlug: string | undefined,
): RevealRegion[] {
  const draft = readSessionDraft(levelSlug);
  if (draft && draft.length > 0) return draft;
  return config.regions;
}

export function ProgressiveRevealDemo({
  config,
  configFilename = "terminator2.json",
  levelSlug,
  onRegionsChange,
  onSaveSuccess,
}: ProgressiveRevealDemoProps) {
  const [revealLevel, setRevealLevel] = useState(-1);
  const [developerMode, setDeveloperMode] = useState(false);
  const [cursor, setCursor] = useState<ImageCoordinate | null>(null);
  const [selectedPoints, setSelectedPoints] = useState<ImageCoordinate[]>([]);
  const [regions, setRegions] = useState<RevealRegion[]>(() =>
    initialRegions(config, levelSlug),
  );
  const [regionLabel, setRegionLabel] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [dirty, setDirty] = useState(() => {
    const draft = readSessionDraft(levelSlug);
    return Boolean(draft && draft.length > 0);
  });

  /** Меняем level только при смене slug/image — не при каждом re-render родителя. */
  const identityKey = `${levelSlug ?? "anon"}:${config.image}:${config.width}x${config.height}`;
  const lastIdentityRef = useRef(identityKey);

  const draftConfig = useMemo<RevealImageConfig>(
    () => ({
      ...config,
      regions,
    }),
    [config, regions],
  );

  const maxRevealLevel = regions.length;
  const isFullyRevealed = revealLevel >= maxRevealLevel && maxRevealLevel > 0;
  const canClose =
    selectedPoints.length >= 3 &&
    cursor !== null &&
    distance(cursor, selectedPoints[0]) <= CLOSE_THRESHOLD;

  // Смена Level → подтянуть disk или session draft
  useEffect(() => {
    if (lastIdentityRef.current === identityKey) return;
    lastIdentityRef.current = identityKey;

    const draft = readSessionDraft(levelSlug);
    const next =
      draft && draft.length > 0 ? draft : config.regions;
    setRegions(next);
    setDirty(Boolean(draft && draft.length > 0));
    setRevealLevel(-1);
    setSelectedPoints([]);
    setIsPreviewing(false);
    setStatus(
      draft && draft.length > 0
        ? `Восстановлен черновик сессии: ${draft.length} област.`
        : null,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- только identity
  }, [identityKey]);

  // Автосохранение черновика в sessionStorage (не на диск)
  useEffect(() => {
    if (!levelSlug) return;
    writeSessionDraft(levelSlug, regions);
  }, [levelSlug, regions]);

  useEffect(() => {
    onRegionsChange?.(regions.length);
  }, [regions, onRegionsChange]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (event.key.toLowerCase() === "d" && !event.repeat) {
        if (isPreviewing) return;
        setDeveloperMode((enabled) => !enabled);
        setCursor(null);
        return;
      }

      if (!developerMode || isPreviewing) return;

      if (event.key === "Escape") {
        setSelectedPoints([]);
        setStatus("Точки текущей области очищены");
      }

      if (event.key === "Enter" && selectedPoints.length >= 3) {
        event.preventDefault();
        finishRegion(selectedPoints);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [developerMode, selectedPoints, regionLabel, regions, isPreviewing]);

  function finishRegion(points: ImageCoordinate[]) {
    if (points.length < 3) {
      setStatus("Нужно минимум 3 точки");
      return;
    }

    const label = regionLabel.trim() || `Область ${regions.length + 1}`;
    const id = slugify(label);
    const nextRegion: RevealRegion = {
      id,
      label,
      points: points.map(({ x, y }) => [x, y]),
    };

    setRegions((current) => [...current, nextRegion]);
    setSelectedPoints([]);
    setRegionLabel("");
    setDirty(true);
    setStatus(
      `Область «${label}» в черновике сессии (${regions.length + 1}). ` +
        `На диск — только через «Сохранить JSON».`,
    );
  }

  function handleCoordinateClick(coordinate: ImageCoordinate) {
    if (selectedPoints.length >= 3) {
      const first = selectedPoints[0];
      if (distance(coordinate, first) <= CLOSE_THRESHOLD) {
        finishRegion(selectedPoints);
        return;
      }
    }

    setSelectedPoints((points) => [...points, coordinate]);
  }

  async function copyConfig() {
    await navigator.clipboard.writeText(JSON.stringify(draftConfig, null, 2));
    setStatus("JSON скопирован в буфер (файл не скачивался)");
  }

  function downloadConfig() {
    const blob = new Blob([`${JSON.stringify(draftConfig, null, 2)}\n`], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = configFilename.includes("/")
      ? configFilename.split("/").pop()!
      : configFilename;
    link.click();
    URL.revokeObjectURL(url);
    setStatus(`Скачан файл ${configFilename}`);
  }

  async function saveConfig() {
    setIsSaving(true);
    try {
      const response = await fetch("/api/dev/reveal-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: configFilename,
          config: draftConfig,
          levelSlug,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "Не удалось сохранить");
      }

      setDirty(false);
      // Черновик сессии можно оставить — он совпадает с диском
      setStatus(
        levelSlug
          ? `Записано на диск: data/levels/${levelSlug}.json · областей: ${regions.length} + full`
          : `Записано на диск: data/${configFilename}`,
      );
      onSaveSuccess?.();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Ошибка сохранения");
    } finally {
      setIsSaving(false);
    }
  }

  async function runPreview() {
    if (isPreviewing) return;
    if (regions.length === 0) {
      setStatus("Preview недоступен: нет областей. Нарисуй и замкни область (D).");
      return;
    }

    setDeveloperMode(false);
    setSelectedPoints([]);
    setIsPreviewing(true);
    setStatus(`Preview: старт · ${regions.length} област.`);
    setRevealLevel(-1);

    // Дать React применить -1 до анимации
    await new Promise((resolve) => window.setTimeout(resolve, 50));

    for (let step = 0; step <= regions.length; step++) {
      await new Promise((resolve) => window.setTimeout(resolve, 750));
      setRevealLevel(step);
      if (step < regions.length) {
        setStatus(
          `Preview: ${step + 1} / ${regions.length} — ${regions[step]?.label ?? "область"}`,
        );
      } else {
        setStatus("Preview: полное изображение");
      }
    }

    await new Promise((resolve) => window.setTimeout(resolve, 1000));
    setStatus(
      dirty
        ? "Preview ок · черновик ещё не на диске — нажми «Сохранить JSON»"
        : "Preview завершён",
    );
    setIsPreviewing(false);
  }

  function discardSessionDraft() {
    clearSessionDraft(levelSlug);
    setRegions(config.regions);
    setDirty(false);
    setSelectedPoints([]);
    setRevealLevel(-1);
    setStatus("Черновик сессии сброшен к версии с диска");
  }

  return (
    <div className="w-full max-w-5xl">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <p className="text-white/40">
          Черновик:{" "}
          <span className={dirty ? "text-amber-200" : "text-emerald-300/80"}>
            {dirty ? "не сохранён на диск" : "совпадает с диском"}
          </span>
          {" · "}
          <span className="text-white/70">{regions.length} област.</span>
        </p>
        {dirty && (
          <button
            type="button"
            onClick={discardSessionDraft}
            className="text-white/35 underline-offset-2 hover:text-white/60 hover:underline"
          >
            Сбросить к диску
          </button>
        )}
      </div>

      <div className="overflow-hidden border border-white/10 bg-black shadow-2xl shadow-black/40">
        <ProgressiveRevealImage
          imageSrc={draftConfig.image}
          revealLevel={revealLevel}
          regions={regions}
          width={draftConfig.width}
          height={draftConfig.height}
          developerMode={developerMode && !isPreviewing}
          cursor={cursor}
          selectedPoints={selectedPoints}
          closeHint={canClose}
          onCursorMove={setCursor}
          onCoordinateClick={handleCoordinateClick}
        />
      </div>

      {developerMode && !isPreviewing && (
        <section className="mt-4 border border-cyan-400/30 bg-cyan-950/20 p-4 font-mono text-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-cyan-300">Developer Mode · D — выйти</p>
            <p className="text-white">
              x: {cursor?.x ?? "—"} · y: {cursor?.y ?? "—"}
            </p>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-white/55">
            Области сразу попадают в <span className="text-cyan-200">черновик сессии</span> (браузер).
            <br />
            На диск пишется только кнопка <span className="text-emerald-200">«Сохранить JSON»</span>.
            <br />
            <span className="text-white/35">«Скачать JSON»</span> — отдельная выгрузка файла, не авто.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={regionLabel}
              onChange={(event) => setRegionLabel(event.target.value)}
              placeholder="Название области (fire, jacket...)"
              className="min-w-[220px] flex-1 border border-white/15 bg-black/40 px-3 py-2 text-xs text-white outline-none placeholder:text-white/25 focus:border-cyan-300/50"
            />
            <button
              type="button"
              disabled={selectedPoints.length < 3}
              onClick={() => finishRegion(selectedPoints)}
              className="border border-cyan-300/40 px-3 py-2 text-xs text-cyan-200 hover:bg-cyan-300 hover:text-black disabled:opacity-30"
            >
              Замкнуть область
            </button>
          </div>

          <p className="mt-3 break-all text-white/60">
            Черновик точек ({selectedPoints.length}):{" "}
            {JSON.stringify(selectedPoints.map(({ x, y }) => [x, y]))}
          </p>

          {canClose && (
            <p className="mt-2 text-xs text-yellow-300">
              Курсор у первой точки — кликните, чтобы замкнуть
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isSaving || regions.length === 0}
              onClick={saveConfig}
              className="border border-emerald-300/40 px-3 py-2 text-xs text-emerald-200 hover:bg-emerald-300 hover:text-black disabled:opacity-30"
            >
              {isSaving ? "Сохранение..." : "Сохранить JSON на диск"}
            </button>
            <button
              type="button"
              disabled={regions.length === 0}
              onClick={downloadConfig}
              className="border border-white/20 px-3 py-2 text-xs text-white/70 hover:border-white/60 hover:text-white disabled:opacity-30"
            >
              Скачать JSON
            </button>
            <button
              type="button"
              onClick={copyConfig}
              className="border border-white/20 px-3 py-2 text-xs text-white/70 hover:border-white/60 hover:text-white"
            >
              Копировать JSON
            </button>
            <button
              type="button"
              disabled={selectedPoints.length === 0}
              onClick={() => setSelectedPoints((points) => points.slice(0, -1))}
              className="border border-white/20 px-3 py-2 text-xs text-white/60 hover:border-white/60 hover:text-white disabled:opacity-30"
            >
              Отменить точку
            </button>
            <button
              type="button"
              disabled={selectedPoints.length === 0}
              onClick={() => setSelectedPoints([])}
              className="border border-white/20 px-3 py-2 text-xs text-white/60 hover:border-white/60 hover:text-white disabled:opacity-30"
            >
              Очистить точки
            </button>
          </div>

          {regions.length > 0 && (
            <ul className="mt-4 space-y-2 border-t border-white/10 pt-3 text-xs text-white/70">
              {regions.map((region, index) => (
                <li
                  key={`${region.id}-${index}`}
                  className="flex items-center justify-between gap-3"
                >
                  <span>
                    {index + 1}. {region.label}{" "}
                    <span className="text-white/35">
                      ({region.points.length} pts)
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setRegions((current) =>
                        current.filter((_, i) => i !== index),
                      );
                      setDirty(true);
                    }}
                    className="text-red-300/80 hover:text-red-200"
                  >
                    Удалить
                  </button>
                </li>
              ))}
            </ul>
          )}

          {status && <p className="mt-3 text-xs text-cyan-200">{status}</p>}
        </section>
      )}

      <div className="mt-7 flex flex-col items-center gap-3">
        <div
          className="flex gap-2"
          aria-label={`Уровень открытия: ${Math.max(revealLevel, 0)} из ${maxRevealLevel}`}
        >
          {Array.from({ length: Math.max(maxRevealLevel, 1) + 1 }, (_, index) => (
            <span
              key={index}
              className={`h-1.5 w-8 transition-colors duration-500 ${
                revealLevel >= 0 && index <= revealLevel
                  ? "bg-white"
                  : "bg-white/15"
              }`}
            />
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            disabled={isFullyRevealed || isPreviewing || regions.length === 0}
            onClick={() =>
              setRevealLevel((current) => {
                const base = current < 0 ? -1 : current;
                return Math.min(base + 1, maxRevealLevel);
              })
            }
            className="border border-white/30 px-6 py-3 text-sm font-medium text-white transition-colors hover:border-white hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:border-white/10 disabled:text-white/30 disabled:hover:bg-transparent"
          >
            {regions.length === 0
              ? "Сначала нарисуй области"
              : isFullyRevealed
                ? "Изображение открыто"
                : "Открыть следующую подсказку"}
          </button>

          <button
            type="button"
            disabled={isPreviewing || regions.length === 0}
            onClick={runPreview}
            className="border border-violet-300/40 px-6 py-3 text-sm font-medium text-violet-100 transition-colors hover:border-violet-200 hover:bg-violet-200 hover:text-black disabled:cursor-not-allowed disabled:border-white/10 disabled:text-white/30"
          >
            {isPreviewing
              ? "Preview…"
              : regions.length === 0
                ? "Preview (нет областей)"
                : `Preview (${regions.length})`}
          </button>

          <button
            type="button"
            disabled={isPreviewing || revealLevel < 0}
            onClick={() => setRevealLevel(-1)}
            className="border border-white/20 px-4 py-3 text-sm text-white/60 transition-colors hover:border-white/50 hover:text-white disabled:opacity-30"
          >
            Сбросить превью
          </button>
        </div>

        {status && (
          <p className="mt-1 max-w-md text-center text-xs text-white/45">
            {status}
          </p>
        )}

        <p className="mt-2 max-w-lg text-center text-xs text-white/30">
          D — разметка · области живут в сессии браузера · «Сохранить JSON на диск» —
          запись в проект · Preview работает по черновику, даже до Save
        </p>
      </div>
    </div>
  );
}
