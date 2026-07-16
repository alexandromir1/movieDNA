"use client";

import { useId, useRef } from "react";

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
  className?: string;
}

function AnimatedRegion({ children }: { children: React.ReactNode }) {
  return (
    <g className="[transform-box:fill-box] [transform-origin:center]">
      {children}
      <animateTransform
        attributeName="transform"
        type="scale"
        values="0.01;1"
        dur="500ms"
        calcMode="spline"
        keySplines="0.22 1 0.36 1"
        additive="sum"
        fill="freeze"
      />
    </g>
  );
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
  className,
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
      aria-label={`Кадр фильма, уровень открытия ${level} из ${maxLevel}`}
      className={cn(
        "block bg-black",
        developerMode && "cursor-crosshair",
        className ?? "h-auto w-full",
      )}
      preserveAspectRatio="xMidYMid meet"
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
            <AnimatedRegion key={region.id}>
              <polygon points={toPoints(region.points)} fill="white" />
            </AnimatedRegion>
          ))}

          {level >= maxLevel && (
            <AnimatedRegion>
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
