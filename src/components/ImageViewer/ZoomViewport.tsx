"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils/cn";

import type { ImageViewerTransform } from "./constants";
import {
  IMAGE_VIEWER_DOUBLE_TAP_SCALE,
  IMAGE_VIEWER_MAX_SCALE,
  IMAGE_VIEWER_MIN_SCALE,
} from "./constants";

const IDENTITY: ImageViewerTransform = { scale: 1, x: 0, y: 0 };
const WHEEL_STEP = 0.0015;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function clampTransform(
  next: ImageViewerTransform,
  viewportW: number,
  viewportH: number,
): ImageViewerTransform {
  const scale = clamp(next.scale, IMAGE_VIEWER_MIN_SCALE, IMAGE_VIEWER_MAX_SCALE);
  if (scale <= 1.01) return IDENTITY;

  const maxX = ((scale - 1) * viewportW) / 2;
  const maxY = ((scale - 1) * viewportH) / 2;
  return {
    scale,
    x: clamp(next.x, -maxX, maxX),
    y: clamp(next.y, -maxY, maxY),
  };
}

interface ZoomViewportProps {
  children: ReactNode;
  className?: string;
  onScaleChange?: (scale: number) => void;
  /** Imperative hooks for toolbar buttons */
  apiRef?: React.MutableRefObject<ZoomViewportApi | null>;
}

export interface ZoomViewportApi {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
  getScale: () => number;
}

export function ZoomViewport({
  children,
  className,
  onScaleChange,
  apiRef,
}: ZoomViewportProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<ImageViewerTransform>(IDENTITY);
  const transformRef = useRef(transform);
  transformRef.current = transform;

  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{
    distance: number;
    scale: number;
    midX: number;
    midY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const panRef = useRef<{
    x: number;
    y: number;
    originX: number;
    originY: number;
  } | null>(null);
  const lastTapRef = useRef<{ t: number; x: number; y: number } | null>(null);
  const movedRef = useRef(false);
  const [animating, setAnimating] = useState(false);

  const measure = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return { w: 1, h: 1 };
    const rect = el.getBoundingClientRect();
    return { w: rect.width, h: rect.height };
  }, []);

  const commit = useCallback(
    (next: ImageViewerTransform, withAnimation = false) => {
      const { w, h } = measure();
      const clamped = clampTransform(next, w, h);
      if (withAnimation) setAnimating(true);
      setTransform(clamped);
      onScaleChange?.(clamped.scale);
      if (withAnimation) {
        window.setTimeout(() => setAnimating(false), 220);
      }
    },
    [measure, onScaleChange],
  );

  const zoomAt = useCallback(
    (clientX: number, clientY: number, nextScale: number, animate = false) => {
      const el = viewportRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const { scale, x, y } = transformRef.current;
      const target = clamp(
        nextScale,
        IMAGE_VIEWER_MIN_SCALE,
        IMAGE_VIEWER_MAX_SCALE,
      );

      if (target <= 1.01) {
        commit(IDENTITY, animate);
        return;
      }

      const px = clientX - rect.left - rect.width / 2;
      const py = clientY - rect.top - rect.height / 2;
      const ratio = target / scale;
      commit(
        {
          scale: target,
          x: px - (px - x) * ratio,
          y: py - (py - y) * ratio,
        },
        animate,
      );
    },
    [commit],
  );

  const reset = useCallback(() => commit(IDENTITY, true), [commit]);

  const bumpScale = useCallback(
    (delta: number) => {
      const el = viewportRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      zoomAt(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
        transformRef.current.scale + delta,
        true,
      );
    },
    [zoomAt],
  );

  useEffect(() => {
    if (!apiRef) return;
    apiRef.current = {
      zoomIn: () => bumpScale(0.35),
      zoomOut: () => bumpScale(-0.35),
      reset,
      getScale: () => transformRef.current.scale,
    };
    return () => {
      apiRef.current = null;
    };
  }, [apiRef, bumpScale, reset]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const next =
        transformRef.current.scale * Math.exp(-event.deltaY * WHEEL_STEP);
      zoomAt(event.clientX, event.clientY, next);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  const onPointerDown = (event: React.PointerEvent) => {
    // Don't steal clicks from toolbar buttons
    if ((event.target as HTMLElement).closest("button")) return;

    const el = viewportRef.current;
    if (!el) return;
    movedRef.current = false;
    el.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    if (pointersRef.current.size === 2) {
      const pts = [...pointersRef.current.values()];
      const dx = pts[0].x - pts[1].x;
      const dy = pts[0].y - pts[1].y;
      pinchRef.current = {
        distance: Math.hypot(dx, dy) || 1,
        scale: transformRef.current.scale,
        midX: (pts[0].x + pts[1].x) / 2,
        midY: (pts[0].y + pts[1].y) / 2,
        originX: transformRef.current.x,
        originY: transformRef.current.y,
      };
      panRef.current = null;
      return;
    }

    if (transformRef.current.scale > 1.01) {
      panRef.current = {
        x: event.clientX,
        y: event.clientY,
        originX: transformRef.current.x,
        originY: transformRef.current.y,
      };
    }
  };

  const onPointerMove = (event: React.PointerEvent) => {
    if (!pointersRef.current.has(event.pointerId)) return;
    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    if (pointersRef.current.size >= 2 && pinchRef.current) {
      movedRef.current = true;
      const pts = [...pointersRef.current.values()];
      const dx = pts[0].x - pts[1].x;
      const dy = pts[0].y - pts[1].y;
      const distance = Math.hypot(dx, dy) || 1;
      const midX = (pts[0].x + pts[1].x) / 2;
      const midY = (pts[0].y + pts[1].y) / 2;
      const pinch = pinchRef.current;
      const nextScale = pinch.scale * (distance / pinch.distance);

      const el = viewportRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const px = pinch.midX - rect.left - rect.width / 2;
      const py = pinch.midY - rect.top - rect.height / 2;
      const ratio = nextScale / pinch.scale;

      commit({
        scale: nextScale,
        x:
          pinch.originX +
          (midX - pinch.midX) +
          (px - pinch.originX) * (1 - ratio),
        y:
          pinch.originY +
          (midY - pinch.midY) +
          (py - pinch.originY) * (1 - ratio),
      });
      return;
    }

    if (panRef.current && pointersRef.current.size === 1) {
      const pan = panRef.current;
      if (Math.hypot(event.clientX - pan.x, event.clientY - pan.y) > 6) {
        movedRef.current = true;
      }
      commit({
        scale: transformRef.current.scale,
        x: pan.originX + (event.clientX - pan.x),
        y: pan.originY + (event.clientY - pan.y),
      });
    }
  };

  const onPointerUp = (event: React.PointerEvent) => {
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
    if (pointersRef.current.size === 0) panRef.current = null;
    try {
      viewportRef.current?.releasePointerCapture(event.pointerId);
    } catch {
      // ignore
    }
  };

  const onDoubleActivate = (clientX: number, clientY: number) => {
    if (transformRef.current.scale > 1.15) {
      commit(IDENTITY, true);
    } else {
      zoomAt(clientX, clientY, IMAGE_VIEWER_DOUBLE_TAP_SCALE, true);
    }
  };

  const onClick = (event: React.MouseEvent) => {
    if (movedRef.current) return;
    if ((event.target as HTMLElement).closest("button")) return;

    const now = Date.now();
    const prev = lastTapRef.current;
    if (
      prev &&
      now - prev.t < 280 &&
      Math.hypot(event.clientX - prev.x, event.clientY - prev.y) < 28
    ) {
      lastTapRef.current = null;
      onDoubleActivate(event.clientX, event.clientY);
      return;
    }
    lastTapRef.current = { t: now, x: event.clientX, y: event.clientY };
  };

  return (
    <div
      ref={viewportRef}
      className={cn(
        "h-full w-full touch-none overflow-hidden",
        transform.scale > 1.01 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in",
        className,
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={onClick}
    >
      <div
        className="flex h-full w-full items-center justify-center will-change-transform"
        style={{
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
          transformOrigin: "center center",
          transition: animating ? "transform 220ms ease-out" : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}
