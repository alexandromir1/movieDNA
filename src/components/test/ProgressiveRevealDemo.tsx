"use client";

import { useEffect, useMemo, useState } from "react";

import { ProgressiveRevealImage } from "@/components/ProgressiveRevealImage";

import type {
  ImageCoordinate,
  RevealImageConfig,
  RevealRegion,
} from "@/types/reveal-image";

interface ProgressiveRevealDemoProps {
  config: RevealImageConfig;
  configFilename?: string;
}

const CLOSE_THRESHOLD = 18;

function distance(a: ImageCoordinate, b: ImageCoordinate): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "region";
}

export function ProgressiveRevealDemo({
  config,
  configFilename = "terminator2.json",
}: ProgressiveRevealDemoProps) {
  const [revealLevel, setRevealLevel] = useState(0);
  const [developerMode, setDeveloperMode] = useState(false);
  const [cursor, setCursor] = useState<ImageCoordinate | null>(null);
  const [selectedPoints, setSelectedPoints] = useState<ImageCoordinate[]>([]);
  const [regions, setRegions] = useState<RevealRegion[]>(config.regions);
  const [regionLabel, setRegionLabel] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const draftConfig = useMemo<RevealImageConfig>(
    () => ({
      ...config,
      regions,
    }),
    [config, regions],
  );

  const maxRevealLevel = regions.length;
  const isFullyRevealed = revealLevel === maxRevealLevel;
  const canClose =
    selectedPoints.length >= 3 &&
    cursor !== null &&
    distance(cursor, selectedPoints[0]) <= CLOSE_THRESHOLD;

  useEffect(() => {
    setRegions(config.regions);
  }, [config]);

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
        setDeveloperMode((enabled) => !enabled);
        setCursor(null);
        setStatus(null);
        return;
      }

      if (!developerMode) return;

      if (event.key === "Escape") {
        setSelectedPoints([]);
        setStatus("Черновик очищен");
      }

      if (event.key === "Enter" && selectedPoints.length >= 3) {
        event.preventDefault();
        finishRegion(selectedPoints);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [developerMode, selectedPoints, regionLabel, regions]);

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
    setStatus(`Добавлена область «${label}». Не забудьте сохранить JSON.`);
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
    setStatus(null);
  }

  async function copyConfig() {
    await navigator.clipboard.writeText(JSON.stringify(draftConfig, null, 2));
    setStatus("JSON скопирован в буфер");
  }

  function downloadConfig() {
    const blob = new Blob([`${JSON.stringify(draftConfig, null, 2)}\n`], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = configFilename;
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
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "Не удалось сохранить");
      }

      setStatus(`Сохранено в data/${configFilename}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Ошибка сохранения");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="w-full max-w-5xl">
      <div className="overflow-hidden border border-white/10 bg-black shadow-2xl shadow-black/40">
        <ProgressiveRevealImage
          imageSrc={draftConfig.image}
          revealLevel={revealLevel}
          regions={regions}
          width={draftConfig.width}
          height={draftConfig.height}
          developerMode={developerMode}
          cursor={cursor}
          selectedPoints={selectedPoints}
          closeHint={canClose}
          onCursorMove={setCursor}
          onCoordinateClick={handleCoordinateClick}
        />
      </div>

      {developerMode && (
        <section className="mt-4 border border-cyan-400/30 bg-cyan-950/20 p-4 font-mono text-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-cyan-300">Developer Mode · D — выйти</p>
            <p className="text-white">
              x: {cursor?.x ?? "—"} · y: {cursor?.y ?? "—"}
            </p>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-white/55">
            1. Кликайте по контуру объекта.
            <br />
            2. Замкните фигуру кликом у первой точки (или Enter).
            <br />
            3. Нажмите «Сохранить JSON» — изменения попадут в{" "}
            <span className="text-cyan-200">data/{configFilename}</span>.
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
              disabled={isSaving}
              onClick={saveConfig}
              className="border border-emerald-300/40 px-3 py-2 text-xs text-emerald-200 hover:bg-emerald-300 hover:text-black disabled:opacity-30"
            >
              {isSaving ? "Сохранение..." : "Сохранить JSON"}
            </button>
            <button
              type="button"
              onClick={downloadConfig}
              className="border border-white/20 px-3 py-2 text-xs text-white/70 hover:border-white/60 hover:text-white"
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
              Очистить
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
                    onClick={() =>
                      setRegions((current) =>
                        current.filter((_, i) => i !== index),
                      )
                    }
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
          aria-label={`Уровень открытия: ${revealLevel} из ${maxRevealLevel}`}
        >
          {Array.from({ length: maxRevealLevel + 1 }, (_, index) => (
            <span
              key={index}
              className={`h-1.5 w-8 transition-colors duration-500 ${
                index <= revealLevel ? "bg-white" : "bg-white/15"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          disabled={isFullyRevealed}
          onClick={() =>
            setRevealLevel((current) =>
              Math.min(current + 1, maxRevealLevel),
            )
          }
          className="mt-3 border border-white/30 px-6 py-3 text-sm font-medium text-white transition-colors hover:border-white hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:border-white/10 disabled:text-white/30 disabled:hover:bg-transparent"
        >
          {isFullyRevealed
            ? "Изображение открыто"
            : "Открыть следующую подсказку"}
        </button>

        <p className="mt-2 text-xs text-white/30">
          Нажмите D для режима разметки
        </p>
      </div>
    </div>
  );
}
