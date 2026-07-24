"use client";

import { useEffect, useId, useRef, useState } from "react";

import type { FragmentPiece, ImagePoint } from "@/types/v2-content";
import { cn } from "@/lib/utils/cn";

const REVEAL_MS = 360;
const CAMERA_MS = 620;
/** Финальная сборка последней улики — спокойнее обычного reveal. */
const FINAL_ASSEMBLE_MS = 520;

type ViewRect = { x: number; y: number; w: number; h: number };

function toPoints(polygon: FragmentPiece["polygon"]): string {
  return polygon.map(([x, y]) => `${x},${y}`).join(" ");
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function pieceBounds(polygon: ImagePoint[]): ViewRect {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of polygon) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  return {
    x: minX,
    y: minY,
    w: Math.max(1, maxX - minX),
    h: Math.max(1, maxY - minY),
  };
}

function unionBounds(rects: ViewRect[]): ViewRect {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const rect of rects) {
    minX = Math.min(minX, rect.x);
    minY = Math.min(minY, rect.y);
    maxX = Math.max(maxX, rect.x + rect.w);
    maxY = Math.max(maxY, rect.y + rect.h);
  }
  return {
    x: minX,
    y: minY,
    w: Math.max(1, maxX - minX),
    h: Math.max(1, maxY - minY),
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpRect(a: ViewRect, b: ViewRect, t: number): ViewRect {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    w: lerp(a.w, b.w, t),
    h: lerp(a.h, b.h, t),
  };
}

function easeOutQuint(t: number): number {
  return 1 - (1 - t) ** 5;
}

/**
 * Камера (viewBox) по объединению открытых кусков.
 * 1 фрагмент → сильный zoom (~90% кадра); дальше отдаление; все → 100%.
 */
function computeCameraRect(
  pieces: FragmentPiece[],
  openedSteps: number,
  imageWidth: number,
  imageHeight: number,
): ViewRect {
  const full: ViewRect = { x: 0, y: 0, w: imageWidth, h: imageHeight };
  const total = pieces.length;
  if (total === 0 || openedSteps <= 0 || openedSteps >= total) {
    return full;
  }

  const visible = pieces.slice(0, openedSteps);
  const content = unionBounds(
    visible.map((piece) => pieceBounds(piece.polygon)),
  );

  // fill: доля viewBox под контентом. Выше = меньше чёрного поля.
  // По мере роста union камера сама отъезжает; fill чуть растёт к финалу.
  const progress = (openedSteps - 1) / Math.max(1, total - 1);
  const fill = 0.92 + progress * 0.04;

  const aspect = imageWidth / imageHeight;
  const cx = content.x + content.w / 2;
  const cy = content.y + content.h / 2;

  let viewW = content.w / fill;
  let viewH = content.h / fill;

  if (viewW / viewH > aspect) {
    viewH = viewW / aspect;
  } else {
    viewW = viewH * aspect;
  }

  viewW = Math.min(viewW, imageWidth);
  viewH = Math.min(viewH, imageHeight);

  let x = cx - viewW / 2;
  let y = cy - viewH / 2;
  x = Math.min(Math.max(0, x), imageWidth - viewW);
  y = Math.min(Math.max(0, y), imageHeight - viewH);

  return { x, y, w: viewW, h: viewH };
}

function useAnimatedViewBox(
  target: ViewRect,
  durationMs: number,
): ViewRect {
  const [current, setCurrent] = useState(target);
  const currentRef = useRef(target);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    currentRef.current = current;
  }, [current]);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setCurrent(target);
      currentRef.current = target;
      return;
    }

    const from = currentRef.current;
    if (
      Math.abs(from.x - target.x) < 0.5 &&
      Math.abs(from.y - target.y) < 0.5 &&
      Math.abs(from.w - target.w) < 0.5 &&
      Math.abs(from.h - target.h) < 0.5
    ) {
      return;
    }

    const start = performance.now();
    if (frameRef.current != null) {
      cancelAnimationFrame(frameRef.current);
    }

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const next = lerpRect(from, target, easeOutQuint(t));
      setCurrent(next);
      currentRef.current = next;
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        frameRef.current = null;
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current != null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- animate only when target changes
  }, [target.x, target.y, target.w, target.h, durationMs]);

  return current;
}

/** Короткое появление нового куска в mask (UI only). */
function AnimatedFragmentPiece({
  children,
  animate,
  isFinal,
}: {
  children: React.ReactNode;
  animate: boolean;
  isFinal?: boolean;
}) {
  if (!animate || prefersReducedMotion()) {
    return <g>{children}</g>;
  }

  const dur = `${isFinal ? FINAL_ASSEMBLE_MS : REVEAL_MS}ms`;

  return (
    <g
      opacity="0"
      className="[transform-box:fill-box] [transform-origin:center]"
    >
      {children}
      <animate
        attributeName="opacity"
        values="0;1"
        dur={dur}
        calcMode="spline"
        keySplines="0.22 1 0.36 1"
        fill="freeze"
      />
      <animateTransform
        attributeName="transform"
        type="scale"
        values={isFinal ? "0.96;1.01;1" : "0.9;1.03;1"}
        keyTimes="0;0.7;1"
        dur={dur}
        calcMode="spline"
        keySplines="0.22 1 0.36 1;0.33 0 0.2 1"
        additive="sum"
        fill="freeze"
      />
    </g>
  );
}

interface FragmentsRevealImageProps {
  imageSrc: string;
  width: number;
  height: number;
  pieces: FragmentPiece[];
  openedSteps: number;
  animatingPieceIndex?: number | null;
  /** Принудительно показать полный кадр (сдача / финал). */
  forceComplete?: boolean;
  className?: string;
  "aria-label"?: string;
}

/**
 * Renderer Fragments + «камера» по viewBox.
 * meet — фрагменты не обрезаются; полный кадр без маски после всех шагов.
 */
export function FragmentsRevealImage({
  imageSrc,
  width,
  height,
  pieces,
  openedSteps,
  animatingPieceIndex = null,
  forceComplete = false,
  className,
  "aria-label": ariaLabel,
}: FragmentsRevealImageProps) {
  const reactId = useId();
  const maskId = `v2-fragments-mask-${reactId.replace(/:/g, "")}`;
  const total = pieces.length;
  const effectiveOpened = forceComplete
    ? total
    : Math.max(0, Math.min(openedSteps, total));
  const reachedEnd = total > 0 && effectiveOpened >= total;
  const isFinalAssemble =
    !forceComplete &&
    reachedEnd &&
    (animatingPieceIndex === total - 1 || animatingPieceIndex == null);
  const [unveiled, setUnveiled] = useState(reachedEnd && forceComplete);
  const [assembleCalm, setAssembleCalm] = useState(false);
  const visible = pieces.slice(0, effectiveOpened);
  const cameraMs =
    isFinalAssemble || (reachedEnd && !forceComplete)
      ? FINAL_ASSEMBLE_MS
      : CAMERA_MS;
  const unveilDelay = isFinalAssemble ? FINAL_ASSEMBLE_MS : REVEAL_MS;

  useEffect(() => {
    if (!reachedEnd) {
      setUnveiled(false);
      setAssembleCalm(false);
      return;
    }
    if (prefersReducedMotion()) {
      setUnveiled(true);
      setAssembleCalm(true);
      return;
    }
    // Полный кадр после короткого fade — и при естественном финале, и при сдаче.
    const timer = window.setTimeout(() => {
      setUnveiled(true);
      if (!forceComplete) {
        setAssembleCalm(true);
      }
    }, unveilDelay);
    return () => window.clearTimeout(timer);
  }, [reachedEnd, effectiveOpened, unveilDelay, forceComplete]);

  const showFullFrame = unveiled;
  const targetCamera = computeCameraRect(
    pieces,
    effectiveOpened,
    width,
    height,
  );
  const camera = useAnimatedViewBox(targetCamera, cameraMs);
  const viewBox = `${camera.x} ${camera.y} ${camera.w} ${camera.h}`;

  return (
    <div
      className={cn(
        className,
        assembleCalm && !forceComplete && "v2-final-assemble",
      )}
      role="img"
      aria-label={ariaLabel}
    >
      <svg
        className="h-full w-full"
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden={ariaLabel ? undefined : true}
      >
        <defs>
          {!showFullFrame ? (
            <mask
              id={maskId}
              x="0"
              y="0"
              width={width}
              height={height}
              maskUnits="userSpaceOnUse"
              maskContentUnits="userSpaceOnUse"
            >
              <rect width={width} height={height} fill="black" />
              {visible.map((piece, index) => (
                <AnimatedFragmentPiece
                  key={piece.id}
                  animate={animatingPieceIndex === index}
                  isFinal={index === total - 1 && animatingPieceIndex === index}
                >
                  <polygon points={toPoints(piece.polygon)} fill="white" />
                </AnimatedFragmentPiece>
              ))}
            </mask>
          ) : null}
        </defs>
        <image
          href={imageSrc}
          width={width}
          height={height}
          preserveAspectRatio="xMidYMid meet"
          mask={showFullFrame ? undefined : `url(#${maskId})`}
          className={
            showFullFrame
              ? forceComplete
                ? "v2-full-reveal"
                : "v2-full-reveal v2-full-reveal--finale"
              : undefined
          }
        />
      </svg>
    </div>
  );
}

export const V2_FRAGMENT_REVEAL_MS = Math.max(REVEAL_MS, CAMERA_MS);
export const V2_FINAL_ASSEMBLE_MS = FINAL_ASSEMBLE_MS;
