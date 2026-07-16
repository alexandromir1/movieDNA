import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

interface ArchiveCardProps {
  date: string;
  status: "played" | "unplayed" | "won" | "lost";
  href: string;
}

const statusLabels = {
  played: "Сыграно",
  unplayed: "Не сыграно",
  won: "Победа",
  lost: "Поражение",
} as const;

export function ArchiveCard({ date, status, href }: ArchiveCardProps) {
  return (
    <Link href={href}>
      <Card className="transition-colors hover:border-zinc-400 dark:hover:border-zinc-600">
        <div className="flex items-center justify-between">
          <span className="font-medium">{date}</span>
          <Badge variant={status === "won" ? "success" : status === "lost" ? "warning" : "default"}>
            {statusLabels[status]}
          </Badge>
        </div>
      </Card>
    </Link>
  );
}
