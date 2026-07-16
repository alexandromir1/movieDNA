import { cn } from "@/lib/utils/cn";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-[10px] font-medium",
        "transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45",
        variant === "primary" &&
          "bg-white text-black shadow-[0_1px_12px_rgb(255_255_255/0.06)] hover:bg-white/90",
        variant === "secondary" &&
          "border border-white/[0.12] bg-white/[0.04] text-white hover:border-white/25 hover:bg-white/[0.07]",
        variant === "accent" &&
          "bg-[var(--accent)] text-black shadow-[0_2px_20px_rgb(244_197_63/0.22)] hover:brightness-105",
        variant === "ghost" && "text-white/60 hover:text-white",
        size === "sm" && "h-8 px-3 text-xs",
        size === "md" && "h-10 px-4 text-sm",
        size === "lg" && "h-12 px-8 text-sm",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
