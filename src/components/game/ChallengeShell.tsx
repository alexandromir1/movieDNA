import { getChallengeNavItems } from "@/actions/game";
import { ArchiveSidebar } from "@/components/archive/ArchiveSidebar";

interface ChallengeShellProps {
  children: React.ReactNode;
  activeDate?: string;
}

/** Игровой layout: Challenge слева, компактный архив справа. */
export async function ChallengeShell({
  children,
  activeDate,
}: ChallengeShellProps) {
  const items = await getChallengeNavItems();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-4 lg:flex-row lg:items-start lg:gap-8 lg:px-6 lg:py-6">
      <div className="min-w-0 flex-1">{children}</div>
      <ArchiveSidebar items={items} activeDate={activeDate} />
    </div>
  );
}
