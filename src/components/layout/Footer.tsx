"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { siteConfig } from "@/config/site";
import { GAME_ROUTES } from "@/lib/game/constants";
import { useLocale } from "@/lib/i18n/LocaleProvider";

/**
 * Desktop footer (+sm). На мобилке скрыт — экономит место под игру.
 * Ссылки: About · Privacy · Terms · GitHub · Contact.
 */
export function Footer() {
  const { t } = useLocale();
  const pathname = usePathname();
  const githubUrl = siteConfig.githubUrl.trim();
  const contactEmail = siteConfig.contactEmail.trim();

  if (pathname === "/v2" || pathname.startsWith("/v2/")) {
    return null;
  }

  return (
    <footer className="mt-auto hidden border-t border-white/[0.06] bg-[#0e0e10] py-6 sm:block">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 text-center">
        <p className="text-xs text-white/30">{t("footer.blurb")}</p>
        <nav
          aria-label={t("footer.about")}
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-white/40"
        >
          <Link
            href={GAME_ROUTES.about}
            className="transition-colors hover:text-white/75"
          >
            {t("footer.about")}
          </Link>
          <Link
            href={GAME_ROUTES.privacy}
            className="transition-colors hover:text-white/75"
          >
            {t("footer.privacy")}
          </Link>
          <Link
            href={GAME_ROUTES.terms}
            className="transition-colors hover:text-white/75"
          >
            {t("footer.terms")}
          </Link>
          {githubUrl ? (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-white/75"
            >
              {t("footer.github")}
            </a>
          ) : null}
          {contactEmail ? (
            <a
              href={`mailto:${contactEmail}`}
              className="transition-colors hover:text-white/75"
            >
              {t("footer.contact")}
            </a>
          ) : null}
        </nav>
        <p className="text-[11px] text-white/20">{t("footer.rights")}</p>
      </div>
    </footer>
  );
}
