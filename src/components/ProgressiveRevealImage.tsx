"use client";

import { useEffect, useId, useRef, useState, Children, cloneElement, isValidElement } from "react";

import { cn } from "@/lib/utils/cn";
import type {
  ImageCoordinate,
  RevealRegion,
} from "@/types/reveal-image";

interface ProgressiveRevealImageProps {
  imageSrc: string;
  revealLevel: number;
  regions: RevealRegion[];
  width: number;
  height: number;
  developerMode?: boolean;
  cursor?: ImageCoordinate | null;
  selectedPoints?: ImageCoordinate[];
  closeHint?: boolean;
  onCursorMove?: (coordinate: ImageCoordinate | null) => void;
  onCoordinateClick?: (coordinate: ImageCoordinate) => void;
  /** cover = full-bleed (slice); contain = целиком вписать (meet). */
  fit?: "contain" | "cover";
  /** snappy — в игре; smooth — витрина на главной. */
  revealMotion?: "snappy" | "smooth";
  /** Длительность smooth-fade (мс). */
  revealFadeMs?: number;
  className?: string;
  "aria-label"?: string;
}

/** SMIL внутри mask часто не интерполируется — для игры оставляем snappy-pop. */
function SnappyRegion({ children }: { children: React.ReactNode }) {
  return (
    <g
      opacity="0"
      className="[transform-box:fill-box] [transform-origin:center]"
    >
      {children}
      <animate
        attributeName="opacity"
        values="0;1"
        dur="620ms"
        calcMode="spline"
        keySplines="0.22 1 0.36 1"
        fill="freeze"
      />
      <animateTransform
        attributeName="transform"
        type="scale"
        values="0.12;1.04;1"
        keyTimes="0;0.72;1"
        dur="620ms"
        calcMode="spline"
        keySplines="0.22 1 0.36 1;0.33 0 0.2 1"
        additive="sum"
        fill="freeze"
      />
    </g>
  );
}

/**
 * Плавный fade для mask: каждый кадр обновляем fillOpacity + blur через React,
 * иначе браузер рисует область «вкл/выкл» без промежуточных значений.
 */
function SmoothRegion({
  children,
  durationMs = 1100,
  blurMax = 26,
}: {
  children: React.ReactNode;
  durationMs?: number;
  blurMax?: number;
}) {
  const rawId = useId().replaceAll(":", "");
  const filterId = `smooth-reveal-${rawId}`;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      // ease-out cubic — мягкое проявление без рывка в конце
      const eased = 1 - (1 - t) ** 3;
      setProgress(eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [durationMs]);

  const blur = blurMax * (1 - progress);

  return (
    <>
      <defs>
        <filter
          id={filterId}
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur stdDeviation={Math.max(blur, 0)} />
        </filter>
      </defs>
      <g filter={blur > 0.2 ? `url(#${filterId})` : undefined}>
        {Children.map(children, (child) => {
          if (!isValidElement<{ fillOpacity?: number; fill?: string }>(child)) {
            return child;
          }
          return cloneElement(child, {
            fill: "white",
            fillOpacity: progress,
          });
        })}
      </g>
    </>
  );
}

function AnimatedRegion({
  children,
  motion = "snappy",
  fadeMs,
}: {
  children: React.ReactNode;
  motion?: "snappy" | "smooth";
  fadeMs?: number;
}) {
  if (motion === "smooth") {
    return <SmoothRegion durationMs={fadeMs}>{children}</SmoothRegion>;
  }
  return <SnappyRegion>{children}</SnappyRegion>;
}

function toPoints(points: number[][]): string {
  return points.map(([x, y]) => `${x},${y}`).join(" ");
}

function getSvgCoordinate(
  svg: SVGSVGElement,
  clientX: number,
  clientY: number,
  width: number,
  height: number,
): ImageCoordinate {
  const rect = svg.getBoundingClientRect();

  return {
    x: Math.round(
      Math.min(width, Math.max(0, ((clientX - rect.left) / rect.width) * width)),
    ),
    y: Math.round(
      Math.min(
        height,
        Math.max(0, ((clientY - rect.top) / rect.height) * height),
      ),
    ),
  };
}

export function ProgressiveRevealImage({
  imageSrc,
  revealLevel,
  regions,
  width,
  height,
  developerMode = false,
  cursor = null,
  selectedPoints = [],
  closeHint = false,
  onCursorMove,
  onCoordinateClick,
  fit = "contain",
  revealMotion = "snappy",
  revealFadeMs,
  className,
  "aria-label": ariaLabel,
}: ProgressiveRevealImageProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const maskId = `reveal-mask-${useId().replaceAll(":", "")}`;
  const maxLevel = regions.length;
  const level = Math.min(maxLevel, Math.max(-1, revealLevel));

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={
        ariaLabel ??
        `Кадр фильма, уровень открытия ${level} из ${maxLevel}`
      }
      className={cn(
        "block bg-black",
        developerMode && "cursor-crosshair",
        className ?? "h-auto w-full",
      )}
      preserveAspectRatio={
        fit === "cover" ? "xMidYMid slice" : "xMidYMid meet"
      }
      onPointerMove={(event) => {
        if (!developerMode) return;
        onCursorMove?.(
          getSvgCoordinate(
            event.currentTarget,
            event.clientX,
            event.clientY,
            width,
            height,
          ),
        );
      }}
      onPointerLeave={() => onCursorMove?.(null)}
      onClick={(event) => {
        if (!developerMode) return;
        onCoordinateClick?.(
          getSvgCoordinate(
            event.currentTarget,
            event.clientX,
            event.clientY,
            width,
            height,
          ),
        );
      }}
    >
      <defs>
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

          {regions.slice(0, level + 1).map((region) => (
            <AnimatedRegion
              key={region.id}
              motion={revealMotion}
              fadeMs={revealFadeMs}
            >
              <polygon points={toPoints(region.points)} fill="white" />
            </AnimatedRegion>
          ))}

          {level >= maxLevel && (
            <AnimatedRegion motion={revealMotion} fadeMs={revealFadeMs}>
              <rect width={width} height={height} fill="white" />
            </AnimatedRegion>
          )}
        </mask>

        <pattern
          id={`${maskId}-small-grid`}
          width="25"
          height="25"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 25 0 L 0 0 0 25"
            fill="none"
            stroke="white"
            strokeOpacity="0.14"
            strokeWidth="1"
          />
        </pattern>
        <pattern
          id={`${maskId}-grid`}
          width="100"
          height="100"
          patternUnits="userSpaceOnUse"
        >
          <rect
            width="100"
            height="100"
            fill={`url(#${maskId}-small-grid)`}
          />
          <path
            d="M 100 0 L 0 0 0 100"
            fill="none"
            stroke="#22d3ee"
            strokeOpacity="0.6"
            strokeWidth="2"
          />
        </pattern>
      </defs>

      <image
        href={imageSrc}
        width={width}
        height={height}
        preserveAspectRatio="xMidYMid meet"
        mask={developerMode ? undefined : `url(#${maskId})`}
      />

      {developerMode && (
        <g aria-hidden="true" pointerEvents="none">
          <rect
            width={width}
            height={height}
            fill={`url(#${maskId}-grid)`}
          />

          {regions.map((region) => (
            <polygon
              key={region.id}
              points={toPoints(region.points)}
              fill="none"
              stroke="#facc15"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          {selectedPoints.length > 1 && (
            <polyline
              points={selectedPoints.map(({ x, y }) => `${x},${y}`).join(" ")}
              fill="none"
              stroke="#22d3ee"
              strokeWidth="3"
              vectorEffect="non-scaling-stroke"
            />
          )}

          {selectedPoints.map(({ x, y }, index) => {
            const isFirst = index === 0;

            return (
              <g key={`${x}-${y}-${index}`}>
                <circle
                  cx={x}
                  cy={y}
                  r={isFirst && closeHint ? 12 : 6}
                  fill={isFirst && closeHint ? "#facc15" : "#22d3ee"}
                  stroke={isFirst && closeHint ? "#fde68a" : undefined}
                  strokeWidth={isFirst && closeHint ? 3 : undefined}
                />
                <text
                  x={x + 10}
                  y={y - 10}
                  fill="white"
                  fontSize="16"
                  stroke="black"
                  strokeWidth="3"
                  paintOrder="stroke"
                >
                  {index + 1}
                </text>
              </g>
            );
          })}

          {cursor && (
            <>
              <line
                x1={cursor.x}
                y1="0"
                x2={cursor.x}
                y2={height}
                stroke="#22d3ee"
                strokeDasharray="5 5"
              />
              <line
                x1="0"
                y1={cursor.y}
                x2={width}
                y2={cursor.y}
                stroke="#22d3ee"
                strokeDasharray="5 5"
              />
            </>
          )}
        </g>
      )}
    </svg>
  );
}
