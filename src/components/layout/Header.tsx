import Link from "next/link";

import { siteConfig } from "@/config/site";
import { GAME_ROUTES } from "@/lib/game/constants";

export function Header() {
  return (
    <header className="border-b border-white/5 bg-[#111]">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link
          href="/"
          className="text-sm font-semibold tracking-[0.18em] text-white"
        >
          {siteConfig.name}
        </Link>

        <nav className="flex items-center gap-5 text-xs uppercase tracking-widest text-white/40">
          <Link href={GAME_ROUTES.today} className="transition-colors hover:text-white/80">
            Игра
          </Link>
          <Link href={GAME_ROUTES.archive} className="transition-colors hover:text-white/80">
            Архив
          </Link>
          <Link href={GAME_ROUTES.stats} className="transition-colors hover:text-white/80">
            Статистика
          </Link>
        </nav>
      </div>
    </header>
  );
}
