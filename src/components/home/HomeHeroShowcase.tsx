"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ProgressiveRevealImage } from "@/components/ProgressiveRevealImage";
import { Button } from "@/components/ui/Button";
import {
  HOME_HERO_MODE,
  HOME_REVEAL_FADE_MS,
  HOME_REVEAL_FIRST_DELAY_MS,
  HOME_REVEAL_HOLD_MS,
  HOME_REVEAL_INTERVAL_MS,
  type HomeHeroMode,
} from "@/config/home-hero";
import { siteConfig } from "@/config/site";
import { GAME_ROUTES } from "@/lib/game/constants";
import { cn } from "@/lib/utils/cn";
import type { RevealImageConfig } from "@/types/reveal-image";

interface HomeHeroShowcaseProps {
  config: RevealImageConfig;
  mode?: HomeHeroMode;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

function useAutoReveal(regionCount: number, enabled: boolean) {
  const [revealLevel, setRevealLevel] = useState(-1);
  const maxLevel = regionCount;

  useEffect(() => {
    if (!enabled || maxLevel <= 0) {
      setRevealLevel(maxLevel);
      return;
    }

    let level = -1;
    setRevealLevel(-1);
    let timeoutId: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const scheduleNext = () => {
      const delay =
        level < 0
          ? HOME_REVEAL_FIRST_DELAY_MS
          : level >= maxLevel
            ? HOME_REVEAL_HOLD_MS
            : HOME_REVEAL_INTERVAL_MS;

      timeoutId = setTimeout(() => {
        if (cancelled) return;
        if (level >= maxLevel) {
          level = -1;
        } else {
          level += 1;
        }
        setRevealLevel(level);
        scheduleNext();
      }, delay);
    };

    scheduleNext();
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [enabled, maxLevel]);

  return revealLevel;
}

function usePointerParallax(enabled: boolean, strength = 12) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!enabled) {
      setOffset({ x: 0, y: 0 });
      return;
    }

    const onMove = (event: PointerEvent) => {
      const nx = event.clientX / window.innerWidth - 0.5;
      const ny = event.clientY / window.innerHeight - 0.5;
      setOffset({ x: nx * strength, y: ny * strength });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [enabled, strength]);

  return offset;
}

function HeroCopy({
  mode,
  className,
}: {
  mode: HomeHeroMode;
  className?: string;
}) {
  const teaser = mode === "reveal_teaser";

  return (
    <div className={cn("relative z-10 max-w-md", className)}>
      <h1 className="text-4xl font-semibold tracking-[0.14em] text-white sm:text-5xl">
        {siteConfig.name}
      </h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/55 sm:text-base">
        {teaser
          ? "Угадаешь раньше, чем откроется вся картина?"
          : "Меньше подсказок — выше счёт. Угадай фильм по визуальной ДНК."}
      </p>
      <Link href={GAME_ROUTES.today} className="mt-8 block w-full max-w-xs">
        <Button size="lg" className="h-12 w-full text-base font-semibold">
          Играть сегодня
        </Button>
      </Link>
    </div>
  );
}

function RevealBackdrop({
  config,
  revealLevel,
  parallax,
}: {
  config: RevealImageConfig;
  revealLevel: number;
  parallax: { x: number; y: number };
}) {
  return (
    <div
      aria-hidden
      className="absolute inset-0 overflow-hidden"
      style={{
        transform: `translate3d(${parallax.x}px, ${parallax.y}px, 0) scale(1.06)`,
        transition: "transform 80ms linear",
      }}
    >
      <ProgressiveRevealImage
        imageSrc={config.image}
        width={config.width}
        height={config.height}
        regions={config.regions}
        revealLevel={revealLevel}
        fit="cover"
        revealMotion="smooth"
        revealFadeMs={HOME_REVEAL_FADE_MS}
        className="h-full w-full"
        aria-label="Демонстрация механики открытия подсказок"
      />
    </div>
  );
}

function ParallaxBackdrop({
  imageSrc,
  parallax,
}: {
  imageSrc: string;
  parallax: { x: number; y: number };
}) {
  return (
    <div
      aria-hidden
      className="absolute inset-0 overflow-hidden"
      style={{
        transform: `translate3d(${parallax.x * 1.6}px, ${parallax.y * 1.6}px, 0) scale(1.12)`,
        transition: "transform 90ms linear",
      }}
    >
      <Image
        src={imageSrc}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover blur-[14px] brightness-[0.55] saturate-[0.85]"
      />
    </div>
  );
}

export function HomeHeroShowcase({
  config,
  mode = HOME_HERO_MODE,
}: HomeHeroShowcaseProps) {
  const reducedMotion = usePrefersReducedMotion();
  const useReveal = mode === "showcase" || mode === "reveal_teaser";
  const useParallaxMode = mode === "parallax";
  const parallaxEnabled = !reducedMotion && (useParallaxMode || useReveal);
  const parallax = usePointerParallax(
    parallaxEnabled,
    useParallaxMode ? 18 : 8,
  );
  const revealLevel = useAutoReveal(
    config.regions.length,
    useReveal && !reducedMotion,
  );

  return (
    <section
      className={cn(
        "relative flex min-h-[calc(100dvh-2.5rem-env(safe-area-inset-top,0px))] flex-col justify-end overflow-hidden",
        "lg:min-h-[calc(100dvh-4.5rem-env(safe-area-inset-top,0px))]",
      )}
    >
      {useParallaxMode ? (
        <ParallaxBackdrop imageSrc={config.image} parallax={parallax} />
      ) : (
        <RevealBackdrop
          config={config}
          revealLevel={revealLevel}
          parallax={parallax}
        />
      )}

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0e0e10] via-[#0e0e10]/55 to-[#0e0e10]/25"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0e0e10]/80 via-[#0e0e10]/25 to-transparent"
      />

      <div className="relative z-10 flex flex-1 flex-col justify-end px-5 pb-14 pt-20 sm:px-8 sm:pb-16 lg:px-12">
        <HeroCopy mode={mode} />
      </div>
    </section>
  );
}
