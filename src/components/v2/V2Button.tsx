import { forwardRef } from "react";

import { cn } from "@/lib/utils/cn";

interface V2ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "md" | "lg";
}

/** Кнопки стенда: тёплый металл / тёмный металл. Без игровых градиентов. */
export const V2Button = forwardRef<HTMLButtonElement, V2ButtonProps>(
  function V2Button(
    { variant = "primary", size = "lg", className, children, ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-semibold uppercase tracking-[0.12em]",
          "rounded-[var(--v2-radius)] transition-[background,box-shadow,border-color,transform] duration-200",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--v2-focus)]",
          "active:translate-y-px disabled:pointer-events-none disabled:opacity-35",
          size === "md" && "h-10 px-4 text-[11px]",
          size === "lg" && "h-11 px-5 text-[12px] sm:h-12 sm:text-[13px]",
          variant === "primary" &&
            "border border-[rgb(201_169_110/0.45)] bg-[linear-gradient(180deg,#d4b87a_0%,#a8894f_100%)] text-[#1a1610] shadow-[0_1px_0_rgb(255_255_255/0.25)_inset,0_8px_22px_rgb(0_0_0/0.35)] hover:border-[rgb(201_169_110/0.7)] hover:brightness-[1.04]",
          variant === "secondary" &&
            "border border-white/10 bg-[linear-gradient(180deg,#323236_0%,#1c1c1f_100%)] text-[var(--v2-ink)] shadow-[0_1px_0_rgb(255_255_255/0.06)_inset] hover:border-[var(--v2-border)] hover:text-white",
          variant === "ghost" &&
            "text-[var(--v2-ink-muted)] hover:bg-white/[0.03] hover:text-[var(--v2-ink)]",
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);
