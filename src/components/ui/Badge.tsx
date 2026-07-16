import { cn } from "@/lib/utils/cn";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variant === "default" && "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
        variant === "success" && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        variant === "warning" && "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
        className,
      )}
    >
      {children}
    </span>
  );
}
