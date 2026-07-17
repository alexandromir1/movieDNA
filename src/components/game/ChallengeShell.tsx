import { getChallengeNavItems } from "@/actions/game";
import { ArchiveSidebar } from "@/components/archive/ArchiveSidebar";

interface ChallengeShellProps {
  children: React.ReactNode;
  activeDate?: string;
}

/**
 * Мобилка: сначала Challenge (картинка + действия), архив — тонкая полоса снизу.
 * Десктоп: игра слева, архив справа.
 */
export async function ChallengeShell({
  children,
  activeDate,
}: ChallengeShellProps) {
  const items = await getChallengeNavItems();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-3 py-2 sm:gap-4 sm:px-4 sm:py-4 lg:flex-row lg:items-start lg:gap-5 lg:px-6 lg:py-6">
      <div className="order-1 min-w-0 flex-1">{children}</div>
      <div className="order-2 border-t border-white/[0.06] pt-2 lg:order-2 lg:w-40 lg:shrink-0 lg:border-0 lg:pt-0">
        <ArchiveSidebar items={items} activeDate={activeDate} />
      </div>
    </div>
  );
}
