"use client";

import { useState } from "react";

import { analytics } from "@/analytics";
import { ImageViewer } from "@/components/ImageViewer";
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
  className?: string;
}

/**
 * Тонкая обёртка Challenge → переиспользуемый ImageViewer.
 * Клик по кадру открывает fullscreen; состояние Challenge не трогается.
 */
export function ChallengeImageViewer({
  imageSrc,
  revealLevel,
  regions,
  width,
  height,
  zoomEnabled = true,
  className,
}: ChallengeImageViewerProps) {
  const [open, setOpen] = useState(false);

  function openViewer() {
    setOpen(true);
    analytics.track("image_viewer_opened", {});
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

  return (
    <>
      {zoomEnabled ? (
        <button
          type="button"
          aria-label="Открыть изображение для изучения"
          onClick={openViewer}
          className="relative block h-full w-full cursor-zoom-in overflow-hidden text-left"
        >
          {frame}
        </button>
      ) : (
        frame
      )}

      <ImageViewer
        open={open}
        onClose={() => setOpen(false)}
        width={width}
        height={height}
        label="Изучение кадра Challenge"
      >
        <ProgressiveRevealImage
          imageSrc={imageSrc}
          revealLevel={revealLevel}
          regions={regions}
          width={width}
          height={height}
          fit="contain"
          className="h-full w-full"
          aria-label="Кадр Challenge"
        />
      </ImageViewer>
    </>
  );
}
