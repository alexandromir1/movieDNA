import { cn } from "@/lib/utils/cn";

interface V2GlassCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
}

/** Лёгкая стеклянная карточка v2. */
export function V2GlassCard({
  children,
  className,
  padding = "md",
}: V2GlassCardProps) {
  return (
    <div
      className={cn(
        "v2-glass rounded-[var(--v2-radius-lg)] border border-[var(--v2-border)]",
        padding === "sm" && "px-3.5 py-2.5",
        padding === "md" && "px-4 py-3.5",
        padding === "lg" && "px-5 py-5 sm:px-6 sm:py-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
