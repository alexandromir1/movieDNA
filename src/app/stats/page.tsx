import { redirect } from "next/navigation";

import { GAME_ROUTES } from "@/lib/game/constants";

export default function StatsPage() {
  redirect(GAME_ROUTES.profile);
}
