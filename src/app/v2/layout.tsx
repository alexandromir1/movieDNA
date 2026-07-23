import { V2ViewportLock } from "@/components/v2/V2ViewportLock";

/**
 * Все экраны /v2 занимают ровно один viewport.
 *
 * Важно: одного `fixed inset-0` недостаточно — у дочернего `h-full`
 * процент высоты иногда не резолвится (особенно Safari), колонка
 * схлопывается по контенту, `flex-1` у слота картинки не растёт,
 * и под кнопками остаётся пустота внутри viewport.
 *
 * Поэтому явно: 100dvh + flex column + flex-1/min-h-0 для children.
 */
export default function V2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-40 flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden overscroll-none bg-[var(--v2-bg,#0f0b08)]">
      <V2ViewportLock />
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
