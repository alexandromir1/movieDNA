import type { Metadata } from "next";

import { getArchiveList, getChallengeNavItems } from "@/actions/game";
import { ArchiveSidebar } from "@/components/archive/ArchiveSidebar";
import { PlayerArchiveList } from "@/components/archive/PlayerArchiveList";
import { Container } from "@/components/layout/Container";

export const metadata: Metadata = {
  title: "Архив",
};

export default async function ArchivePage() {
  const [items, navItems] = await Promise.all([
    getArchiveList(),
    getChallengeNavItems(),
  ]);

  return (
    <Container className="max-w-6xl">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
        <div className="min-w-0 flex-1">
          <h1 className="mb-2 text-2xl font-bold">Архив</h1>
          <p className="mb-6 max-w-xl text-sm text-white/40">
            История твоих Daily Challenge. Непройденные дни можно наверстать один
            раз; после завершения игра закрывается и остаётся в истории — без
            повторного набора очков.
          </p>

          <PlayerArchiveList items={items} />
        </div>

        <ArchiveSidebar items={navItems} />
      </div>
    </Container>
  );
}
