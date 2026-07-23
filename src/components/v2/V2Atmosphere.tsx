"use client";

import { cn } from "@/lib/utils/cn";

interface V2AtmosphereProps {
  className?: string;
  /** Richer ambient for home / result; soft for game focus. */
  intensity?: "soft" | "rich";
}

/**
 * Архивный стол: тёплая бумага, лампа, зерно, виньетка.
 * Без неона и без новых декоративных предметов.
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
      <div className="v2-archive-paper absolute inset-0" />
      <div
        className={cn(
          "absolute inset-0 v2-lab-grid",
          rich ? "opacity-70" : "opacity-40",
        )}
      />
      {/* Настольная лампа — тёплый центр */}
      <div
        className={cn(
          "absolute left-1/2 top-[18%] h-[70%] w-[90%] -translate-x-1/2 rounded-full blur-3xl",
          rich
            ? "bg-[rgb(180_130_70/0.14)] opacity-90"
            : "bg-[rgb(180_130_70/0.1)] opacity-70",
        )}
      />
      <div
        className={cn(
          "absolute -left-[25%] top-[-20%] h-[55%] w-[70%] rounded-full blur-3xl",
          rich
            ? "bg-[var(--v2-glow-a)] opacity-55"
            : "bg-[var(--v2-glow-a)] opacity-28",
        )}
      />
      <div
        className={cn(
          "absolute -right-[20%] bottom-[-10%] h-[50%] w-[60%] rounded-full blur-3xl",
          rich
            ? "bg-[var(--v2-glow-b)] opacity-50"
            : "bg-[var(--v2-glow-b)] opacity-25",
        )}
      />
      <div className="v2-film-grain absolute inset-0" />
      <div className="v2-lamp-vignette absolute inset-0" />
    </div>
  );
}
