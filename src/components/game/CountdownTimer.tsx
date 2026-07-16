interface CountdownTimerProps {
  targetDate: string;
}

export function CountdownTimer({ targetDate }: CountdownTimerProps) {
  return (
    <p className="text-sm text-zinc-500">
      Следующий кадр через: <span className="font-mono">{targetDate}</span>
    </p>
  );
}
