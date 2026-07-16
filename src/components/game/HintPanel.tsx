interface HintPanelProps {
  hints: string[];
  revealedCount: number;
}

export function HintPanel({ hints, revealedCount }: HintPanelProps) {
  const visibleHints = hints.slice(0, revealedCount);

  if (visibleHints.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 dark:border-zinc-700">
        Подсказки появятся после неверных попыток
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {visibleHints.map((hint, index) => (
        <li
          key={index}
          className="rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200"
        >
          {hint}
        </li>
      ))}
    </ul>
  );
}
