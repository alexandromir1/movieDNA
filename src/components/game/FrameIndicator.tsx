interface FrameIndicatorProps {
  total: number;
  current: number;
  revealedCount: number;
}

export function FrameIndicator({ total, current, revealedCount }: FrameIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }, (_, index) => {
        const isActive = index === current;
        const isRevealed = index <= revealedCount;

        return (
          <span
            key={index}
            className={[
              "h-1.5 w-6 rounded-full transition-colors",
              isActive ? "bg-white" : isRevealed ? "bg-white/40" : "bg-white/10",
            ].join(" ")}
            aria-label={`Кадр ${index + 1}`}
          />
        );
      })}
    </div>
  );
}
