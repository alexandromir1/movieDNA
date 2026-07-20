"use client";

import { useRef, useState } from "react";

import { analytics } from "@/analytics";
import { ProgressiveRevealImage } from "@/components/ProgressiveRevealImage";
import { cn } from "@/lib/utils/cn";
import type { RevealRegion } from "@/types/reveal-image";

interface ChallengeImageViewerProps {
  imageSrc: string;
  revealLevel: number;
  regions: RevealRegion[];
  width: number;
  height: number;
  /** На стартовом экране (чёрный кадр) просмотр не нужен. */
  zoomEnabled?: boolean;
  /** Блокировка клика после выбора из поиска (ghost click на mobile). */
  clickGuardUntil?: number;
  enlarged?: boolean;
  onEnlargedChange?: (enlarged: boolean) => void;
  className?: string;
}

/**
 * Клик по кадру → простое увеличение ×1.5 (без тяжёлого fullscreen zoom).
 */
export function ChallengeImageViewer({
  imageSrc,
  revealLevel,
  regions,
  width,
  height,
  zoomEnabled = true,
  clickGuardUntil = 0,
  enlarged = false,
  onEnlargedChange,
  className,
}: ChallengeImageViewerProps) {
  const [localEnlarged, setLocalEnlarged] = useState(false);
  const isEnlarged = onEnlargedChange ? enlarged : localEnlarged;
  const lastToggleRef = useRef(0);

  function setEnlarged(next: boolean) {
    if (onEnlargedChange) onEnlargedChange(next);
    else setLocalEnlarged(next);
  }

  function toggleEnlarge() {
    if (Date.now() < clickGuardUntil) return;
    // Игнор повторного срабатывания от ghost click сразу после toggle
    if (Date.now() - lastToggleRef.current < 350) return;
    lastToggleRef.current = Date.now();

    const next = !isEnlarged;
    setEnlarged(next);
    if (next) {
      analytics.track("image_viewer_opened", {});
    }
  }

  const frame = (
    <ProgressiveRevealImage
      imageSrc={imageSrc}
      revealLevel={revealLevel}
      regions={regions}
      width={width}
      height={height}
      className={cn("h-full max-h-full w-full", className)}
    />
  );

  if (!zoomEnabled) {
    return frame;
  }

  return (
    <button
      type="button"
      aria-label={
        isEnlarged
          ? "Уменьшить изображение"
          : "Увеличить изображение в полтора раза"
      }
      aria-pressed={isEnlarged}
      onClick={toggleEnlarge}
      className={cn(
        "relative block h-full w-full overflow-hidden text-left",
        isEnlarged ? "cursor-zoom-out" : "cursor-zoom-in",
      )}
    >
      {frame}
    </button>
  );
}
