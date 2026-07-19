"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils/cn";

import { IMAGE_VIEWER_OPEN_MS } from "./constants";
import { useFocusTrap } from "./useFocusTrap";
import { ZoomViewport, type ZoomViewportApi } from "./ZoomViewport";

export interface ImageViewerProps {
  open: boolean;
  onClose: () => void;
  /** Простой режим: URL уже загруженного изображения (кэш браузера). */
  src?: string;
  alt?: string;
  /**
   * Кастомный контент (например ProgressiveRevealImage).
   * Предпочтительнее `src`, если нужна маска / SVG.
   */
  children?: ReactNode;
  /** Исходные пропорции кадра — чтобы вписать в экран без растягивания. */
  width?: number;
  height?: number;
  /** aria-label диалога */
  label?: string;
  className?: string;
}

function useFitFrame(width?: number, height?: number) {
  const [frame, setFrame] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const update = () => {
      const maxW = window.innerWidth;
      const maxH = window.innerHeight;
      if (!width || !height || width <= 0 || height <= 0) {
        setFrame({ w: maxW, h: maxH });
        return;
      }
      const scale = Math.min(maxW / width, maxH / height);
      setFrame({
        w: Math.max(1, Math.floor(width * scale)),
        h: Math.max(1, Math.floor(height * scale)),
      });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [width, height]);

  return frame;
}

/**
 * Полноэкранный image viewer без привязки к домену.
 * Overlay поверх текущего UI — состояние страницы не сбрасывается.
 */
export function ImageViewer({
  open,
  onClose,
  src,
  alt = "",
  children,
  width,
  height,
  label = "Просмотр изображения",
  className,
}: ImageViewerProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<ZoomViewportApi | null>(null);
  const [mounted, setMounted] = useState(false);
  const [entered, setEntered] = useState(false);
  const [scaleLabel, setScaleLabel] = useState(100);
  const frame = useFitFrame(width, height);

  useFocusTrap(open, dialogRef);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setEntered(false);
      setScaleLabel(100);
      return;
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const enterId = window.requestAnimationFrame(() => {
      if (reduceMotion) {
        setEntered(true);
        return;
      }
      window.requestAnimationFrame(() => setEntered(true));
    });

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        apiRef.current?.zoomIn();
      }
      if (event.key === "-" || event.key === "_") {
        event.preventDefault();
        apiRef.current?.zoomOut();
      }
      if (event.key === "0") {
        event.preventDefault();
        apiRef.current?.reset();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.cancelAnimationFrame(enterId);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  const content =
    children ??
    (src ? (
      // eslint-disable-next-line @next/next/no-img-element -- reuse cached URL, no Next Image optimizer hop
      <img
        src={src}
        alt={alt}
        draggable={false}
        className="h-full w-full select-none object-contain"
      />
    ) : null);

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className={cn("fixed inset-0 z-[90]", className)}
    >
      <span id={titleId} className="sr-only">
        {label}
      </span>

      <button
        type="button"
        tabIndex={-1}
        aria-label="Закрыть просмотр"
        className={cn(
          "absolute inset-0 bg-black/80 transition-opacity",
          entered ? "opacity-100" : "opacity-0",
        )}
        style={{ transitionDuration: `${IMAGE_VIEWER_OPEN_MS}ms` }}
        onClick={onClose}
      />

      <div
        className={cn(
          "pointer-events-none absolute inset-0 flex items-center justify-center transition-[opacity,transform]",
          entered ? "scale-100 opacity-100" : "scale-[0.92] opacity-0",
        )}
        style={{
          transitionDuration: `${IMAGE_VIEWER_OPEN_MS}ms`,
          transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <div
          className="pointer-events-auto overflow-hidden"
          style={{
            width: frame.w || "100%",
            height: frame.h || "100%",
            maxWidth: "100vw",
            maxHeight: "100dvh",
          }}
        >
          <ZoomViewport
            apiRef={apiRef}
            className="h-full w-full"
            onScaleChange={(scale) => setScaleLabel(Math.round(scale * 100))}
          >
            {content}
          </ZoomViewport>
        </div>
      </div>

      <button
        type="button"
        aria-label="Закрыть"
        onClick={onClose}
        className={cn(
          "absolute top-[max(0.75rem,env(safe-area-inset-top))] right-[max(0.75rem,env(safe-area-inset-right))] z-10",
          "flex h-10 w-10 items-center justify-center rounded-full text-xl leading-none text-white/90",
          "bg-black/40 backdrop-blur-sm transition hover:bg-black/60 hover:text-white",
          entered ? "opacity-100" : "opacity-0",
        )}
        style={{ transitionDuration: `${IMAGE_VIEWER_OPEN_MS}ms` }}
      >
        ✕
      </button>

      <div
        className={cn(
          "absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-10 flex -translate-x-1/2 items-center gap-1",
          "rounded-full border border-white/10 bg-black/45 p-1 backdrop-blur-md",
          entered ? "opacity-100" : "opacity-0",
        )}
        style={{ transitionDuration: `${IMAGE_VIEWER_OPEN_MS}ms` }}
      >
        <ToolbarButton
          ariaLabel="Уменьшить"
          onClick={() => apiRef.current?.zoomOut()}
        >
          −
        </ToolbarButton>
        <ToolbarButton
          ariaLabel="Сбросить масштаб до 100%"
          onClick={() => apiRef.current?.reset()}
          className="min-w-[3.5rem] px-2 text-[11px] tracking-wide"
        >
          {scaleLabel}%
        </ToolbarButton>
        <ToolbarButton
          ariaLabel="Увеличить"
          onClick={() => apiRef.current?.zoomIn()}
        >
          +
        </ToolbarButton>
      </div>
    </div>,
    document.body,
  );
}

function ToolbarButton({
  children,
  ariaLabel,
  onClick,
  className,
}: {
  children: ReactNode;
  ariaLabel: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full text-base font-medium text-white/90",
        "transition hover:bg-white/10 hover:text-white active:scale-[0.97]",
        className,
      )}
    >
      {children}
    </button>
  );
}
