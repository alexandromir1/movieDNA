import { cn } from "@/lib/utils/cn";

interface V2ProgressDotsProps {
  current: number;
  total: number;
  maxDots?: number;
  className?: string;
  label?: string;
}

/** Индикатор прогресса кампании — латунные точки или тонкий бар. */
export function V2ProgressDots({
  current,
  total,
  maxDots = 8,
  className,
  label,
}: V2ProgressDotsProps) {
  const safeTotal = Math.max(1, total);
  const safeCurrent = Math.min(Math.max(1, current), safeTotal);

  if (safeTotal > maxDots) {
    const pct = (safeCurrent / safeTotal) * 100;
    return (
      <div className={cn("w-full", className)}>
        {label ? (
          <p className="mb-1.5 text-center text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--v2-ink-muted)]">
            {label}
          </p>
        ) : null}
        <div className="h-px overflow-hidden bg-white/10">
          <div
            className="h-full bg-[var(--v2-accent)] transition-[width] duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center gap-1.5", className)}>
      {label ? (
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--v2-ink-muted)]">
          {label}
        </p>
      ) : null}
      <div className="flex items-center gap-1.5" aria-hidden>
        {Array.from({ length: safeTotal }, (_, index) => (
          <span
            key={index}
            className={cn(
              "h-1.5 w-1.5 rounded-full transition-colors duration-300",
              index < safeCurrent
                ? "bg-[var(--v2-accent)]"
                : "bg-white/15",
            )}
          />
        ))}
      </div>
    </div>
  );
}
