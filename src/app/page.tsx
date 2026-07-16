import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { siteConfig } from "@/config/site";
import { GAME_ROUTES } from "@/lib/game/constants";

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="mb-3 text-3xl font-semibold tracking-[0.12em] text-white">
        {siteConfig.name}
      </h1>
      <p className="mb-10 max-w-sm text-sm text-white/40">{siteConfig.description}</p>
      <Link href={GAME_ROUTES.today}>
        <Button size="lg">Today&apos;s Challenge</Button>
      </Link>
    </div>
  );
}
