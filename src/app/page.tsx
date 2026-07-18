import { HomeHeroShowcase } from "@/components/home/HomeHeroShowcase";
import { HOME_HERO_MODE } from "@/config/home-hero";
import heroReveal from "../../data/home/hero-reveal.json";

import type { RevealImageConfig } from "@/types/reveal-image";

const heroConfig = heroReveal as RevealImageConfig;

export default function HomePage() {
  return <HomeHeroShowcase config={heroConfig} mode={HOME_HERO_MODE} />;
}
