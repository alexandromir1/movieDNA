"use client";

import Link from "next/link";

import { GAME_ROUTES } from "@/lib/game/constants";
import { useLocale } from "@/lib/i18n/LocaleProvider";

interface LegalDocViewProps {
  kind: "privacy" | "terms";
}

/** Короткие legal-страницы; тексты из словарей. */
export function LegalDocView({ kind }: LegalDocViewProps) {
  const { t } = useLocale();
  const titleKey =
    kind === "privacy" ? "legal.privacyTitle" : "legal.termsTitle";
  const bodyKey = kind === "privacy" ? "legal.privacyBody" : "legal.termsBody";

  return (
    <article className="mx-auto w-full max-w-2xl pb-16 pt-2">
      <h1 className="text-3xl font-semibold tracking-tight text-white">
        {t(titleKey)}
      </h1>
      <p className="mt-5 text-sm leading-relaxed text-white/55 sm:text-base">
        {t(bodyKey)}
      </p>
      <Link
        href={GAME_ROUTES.about}
        className="mt-10 inline-block text-sm text-white/40 underline-offset-2 hover:text-white/70 hover:underline"
      >
        {t("legal.backToAbout")}
      </Link>
    </article>
  );
}
