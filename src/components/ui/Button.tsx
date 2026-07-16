import { cn } from "@/lib/utils/cn";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
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
        "inline-flex items-center justify-center rounded-none font-medium transition-colors disabled:opacity-50",
        variant === "primary" && "bg-white text-black hover:bg-white/90",
        variant === "secondary" && "border border-white/20 bg-transparent text-white hover:border-white/40",
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
