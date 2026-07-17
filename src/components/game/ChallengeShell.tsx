import { getChallengeNavItems } from "@/actions/game";
import { ArchiveSidebar } from "@/components/archive/ArchiveSidebar";

interface ChallengeShellProps {
  children: React.ReactNode;
  activeDate?: string;
}

/** Игровой layout: на мобилке архив сверху тонкой полосой, игра ниже. */
export async function ChallengeShell({
  children,
  activeDate,
}: ChallengeShellProps) {
  const items = await getChallengeNavItems();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-3 py-3 sm:gap-4 sm:px-4 sm:py-4 lg:flex-row lg:items-start lg:gap-5 lg:px-6 lg:py-6">
      <div className="order-1 lg:order-2 lg:w-40 lg:shrink-0">
        <ArchiveSidebar items={items} activeDate={activeDate} />
      </div>
      <div className="order-2 min-w-0 flex-1 lg:order-1">{children}</div>
    </div>
  );
}
