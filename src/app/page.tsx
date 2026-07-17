import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { siteConfig } from "@/config/site";
import { GAME_ROUTES } from "@/lib/game/constants";

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:py-24">
      <h1 className="mb-3 text-3xl font-semibold tracking-[0.12em] text-white">
        {siteConfig.name}
      </h1>
      <p className="max-w-xs text-sm leading-relaxed text-white/45">
        Угадай фильм по визуальной ДНК — не по кадру из фильма
      </p>
      <p className="mt-3 text-xs font-medium text-white/35">
        📅 Каждый день — новый Challenge
      </p>
      <Link href={GAME_ROUTES.today} className="mt-8 block w-full max-w-xs">
        <Button size="lg" className="h-12 w-full text-base font-semibold">
          Играть сегодня
        </Button>
      </Link>
    </div>
  );
}
