import { Badge } from "@/components/ui/Badge";

interface AttemptCounterProps {
  current: number;
  max: number;
}

export function AttemptCounter({ current, max }: AttemptCounterProps) {
  const remaining = max - current;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-zinc-600 dark:text-zinc-400">Попыток осталось:</span>
      <Badge variant={remaining <= 2 ? "warning" : "default"}>{remaining}</Badge>
    </div>
  );
}
