"use client";

import { cn } from "@/lib/utils/cn";

interface V2AtmosphereProps {
  className?: string;
  /** Richer ambient for home / result; soft for game focus. */
  intensity?: "soft" | "rich";
}

/**
 * Фон исследовательского стенда: сетка, тёплое свечение, зерно, виньетка.
 * Без неона и без отвлекающих постеров на игровом экране.
 */
export function V2Atmosphere({
  className,
  intensity = "soft",
}: V2AtmosphereProps) {
  const rich = intensity === "rich";

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
      aria-hidden
    >
      <div className="absolute inset-0 bg-[var(--v2-bg)]" />
      <div
        className={cn(
          "absolute inset-0 v2-lab-grid",
          rich ? "opacity-100" : "opacity-60",
        )}
      />
      <div
        className={cn(
          "absolute -left-[25%] top-[-20%] h-[55%] w-[70%] rounded-full blur-3xl",
          rich
            ? "bg-[var(--v2-glow-a)] opacity-80"
            : "bg-[var(--v2-glow-a)] opacity-40",
        )}
      />
      <div
        className={cn(
          "absolute -right-[20%] bottom-[-10%] h-[50%] w-[60%] rounded-full blur-3xl",
          rich
            ? "bg-[var(--v2-glow-b)] opacity-70"
            : "bg-[var(--v2-glow-b)] opacity-35",
        )}
      />
      <div className="v2-film-grain absolute inset-0" />
      <div className="v2-vignette absolute inset-0" />
    </div>
  );
}
