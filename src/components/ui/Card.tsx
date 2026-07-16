import { cn } from "@/lib/utils/cn";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-[#1a1a1a] p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
