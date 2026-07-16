import type { Metadata } from "next";

import { ProgressiveRevealDemo } from "@/components/test/ProgressiveRevealDemo";
import levelTerminator2 from "../../../data/levels/terminator-2.json";

import type { RevealImageConfig } from "@/types/reveal-image";

export const metadata: Metadata = {
  title: "Reveal Region Editor",
};

export default function TestPage() {
  const config: RevealImageConfig = {
    image: levelTerminator2.image,
    width: levelTerminator2.width,
    height: levelTerminator2.height,
    regions: levelTerminator2.revealRegions.map((region) => ({
      id: region.id,
      label: region.name,
      points: region.polygon,
    })),
  };

  return (
    <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center px-4 py-10 sm:px-6">
      {/* TODO: сохранение обратно в Level JSON (data/levels/...) */}
      <ProgressiveRevealDemo
        config={config}
        configFilename="terminator2.json"
      />
    </div>
  );
}
