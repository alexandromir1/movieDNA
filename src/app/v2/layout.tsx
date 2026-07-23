/**
 * Все экраны /v2 занимают один viewport без скролла страницы.
 * (Safari iOS иначе раздувает body поверх 100dvh.)
 */
export default function V2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 overflow-hidden overscroll-none bg-[var(--v2-bg,#0f0b08)]">
      {children}
    </div>
  );
}
