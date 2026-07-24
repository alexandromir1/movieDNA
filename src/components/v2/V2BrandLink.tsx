import Link from "next/link";

import { LogoMark } from "@/components/branding/Logo";
import { V2_ROUTES } from "@/lib/game/constants";
import { cn } from "@/lib/utils/cn";

interface V2BrandLinkProps {
  /** Размер знака на mobile / desktop. */
  markSize?: number | { mobile: number; desktop: number };
  className?: string;
  /** Показать слово MovieDNA рядом со знаком. */
  showWordmark?: boolean;
  wordmarkClassName?: string;
  /**
   * false = только марка кабинета, без перехода (не уводит в V1 / другой экран).
   * @default false на полке V2
   */
  interactive?: boolean;
}

/** Логотип MovieDNA на полке кабинета. */
export function V2BrandLink({
  markSize = 26,
  className,
  showWordmark = true,
  wordmarkClassName,
  interactive = false,
}: V2BrandLinkProps) {
  const mobile =
    typeof markSize === "number" ? markSize : markSize.mobile;
  const desktop =
    typeof markSize === "number" ? markSize : markSize.desktop;
  const responsive = typeof markSize !== "number";

  const mark = (
    <>
      {responsive ? (
        <>
          <LogoMark size={mobile} className="sm:hidden" />
          <LogoMark size={desktop} className="hidden sm:block" />
        </>
      ) : (
        <LogoMark size={markSize as number} />
      )}
      {showWordmark ? (
        <span
          className={cn(
            "truncate text-[12px] font-semibold tracking-[0.06em] sm:text-[13px]",
            wordmarkClassName,
          )}
        >
          <span className="text-[var(--v2-ink)]">Movie</span>
          <span className="text-[var(--v2-accent)]">DNA</span>
        </span>
      ) : null}
    </>
  );

  if (!interactive) {
    return (
      <span
        className={cn(
          "inline-flex min-w-0 items-center gap-1.5",
          className,
        )}
        aria-label="MovieDNA"
      >
        {mark}
      </span>
    );
  }

  return (
    <Link
      href={V2_ROUTES.home}
      className={cn(
        "inline-flex min-w-0 items-center gap-1.5 rounded-sm outline-none transition-opacity hover:opacity-90",
        "focus-visible:ring-1 focus-visible:ring-[var(--v2-focus)]",
        className,
      )}
      aria-label="MovieDNA — на главную"
    >
      {mark}
    </Link>
  );
}
