import { siteConfig } from "@/config/site";

/** На мобилке скрыт — экономит место под игровые кнопки (Instagram WebView). */
export function Footer() {
  return (
    <footer className="mt-auto hidden border-t border-white/[0.06] bg-[#0e0e10] py-5 sm:block">
      <div className="mx-auto max-w-5xl px-4 text-center text-xs text-white/25">
        <p>{siteConfig.description}</p>
      </div>
    </footer>
  );
}
