import { siteConfig } from "@/config/site";

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#111] py-6">
      <div className="mx-auto max-w-5xl px-4 text-center text-xs text-white/25">
        <p>{siteConfig.description}</p>
      </div>
    </footer>
  );
}
