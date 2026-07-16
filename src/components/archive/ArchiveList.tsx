import { ArchiveCard } from "@/components/archive/ArchiveCard";

interface ArchiveItem {
  date: string;
  status: "played" | "unplayed" | "won" | "lost";
}

interface ArchiveListProps {
  items: ArchiveItem[];
}

export function ArchiveList({ items }: ArchiveListProps) {
  if (items.length === 0) {
    return (
      <p className="text-center text-zinc-500">Архив пока пуст</p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <ArchiveCard
          key={item.date}
          date={item.date}
          status={item.status}
          href={`/game/${item.date}`}
        />
      ))}
    </div>
  );
}
