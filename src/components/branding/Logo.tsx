import { cn } from "@/lib/utils/cn";

interface LogoMarkProps {
  /** Размер в px (квадрат) */
  size?: number;
  className?: string;
}

/**
 * Знак MovieDNA: двойная спираль из точек с абстрактными
 * киносимволами внутри (треугольник play, кадр, звезда-точка).
 */
export function LogoMark({ size = 32, className }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <rect width="32" height="32" rx="8" fill="var(--accent, #F4C53F)" fillOpacity="0.12" />
      {/* Левая нить спирали (акцент) */}
      <circle cx="11" cy="5" r="1.6" fill="var(--accent, #F4C53F)" />
      <circle cx="13.5" cy="9.5" r="1.4" fill="var(--accent, #F4C53F)" />
      <circle cx="18.5" cy="13.5" r="1.3" fill="var(--accent, #F4C53F)" />
      <circle cx="21" cy="18" r="1.4" fill="var(--accent, #F4C53F)" />
      <circle cx="18.5" cy="22.5" r="1.4" fill="var(--accent, #F4C53F)" />
      <circle cx="13.5" cy="26.5" r="1.6" fill="var(--accent, #F4C53F)" />
      {/* Правая нить спирали (белая) */}
      <circle cx="21" cy="5" r="1.6" fill="white" fillOpacity="0.9" />
      <circle cx="18.5" cy="9.5" r="1.4" fill="white" fillOpacity="0.85" />
      <circle cx="13.5" cy="13.5" r="1.3" fill="white" fillOpacity="0.8" />
      <circle cx="11" cy="18" r="1.4" fill="white" fillOpacity="0.85" />
      <circle cx="13.5" cy="22.5" r="1.4" fill="white" fillOpacity="0.85" />
      <circle cx="18.5" cy="26.5" r="1.6" fill="white" fillOpacity="0.9" />
      {/* Перекладины между нитями */}
      <circle cx="16" cy="7.2" r="0.8" fill="white" fillOpacity="0.45" />
      <circle cx="16" cy="15.8" r="0.8" fill="white" fillOpacity="0.45" />
      <circle cx="16" cy="24.3" r="0.8" fill="white" fillOpacity="0.45" />
      {/* Абстрактный киносимвол: play-треугольник в центре спирали */}
      <path
        d="M14.9 17.4v3.2l2.9-1.6-2.9-1.6z"
        fill="var(--accent, #F4C53F)"
        fillOpacity="0.9"
      />
    </svg>
  );
}

interface LogoProps {
  /** Полная дата (десктоп) */
  dateLabel?: string;
  /** Короткая дата (мобилка) */
  dateLabelShort?: string;
  /** Компактный вариант для узкой шапки */
  compact?: boolean;
  className?: string;
}

export function Logo({
  dateLabel,
  dateLabelShort,
  compact = false,
  className,
}: LogoProps) {
  const short = dateLabelShort ?? dateLabel;

  return (
    <span
      className={cn(
        "flex min-w-0 items-center",
        compact ? "gap-2" : "gap-3",
        className,
      )}
    >
      <LogoMark size={compact ? 28 : 38} />
      <span className="flex min-w-0 flex-col leading-tight">
        <span
          className={cn(
            "font-bold tracking-[0.12em] text-white",
            compact ? "text-[15px] sm:text-base" : "text-lg sm:text-xl",
          )}
        >
          MovieDNA
        </span>
        {(dateLabel || short) && (
          <span
            className={cn(
              "truncate capitalize text-white/45",
              compact ? "mt-0 text-[11px] sm:text-xs" : "mt-0.5 text-[13px]",
            )}
          >
            <span className="sm:hidden">{short}</span>
            <span className="hidden sm:inline">{dateLabel ?? short}</span>
          </span>
        )}
      </span>
    </span>
  );
}
