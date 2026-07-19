"use client";

import { useTranslations } from "@/lib/i18n/LocaleProvider";

export function ArchivePageHeader() {
  const t = useTranslations();

  return (
    <>
      <h1 className="text-2xl font-bold text-white">{t("archive.title")}</h1>
      <p className="mt-2 mb-7 text-sm text-white/40">{t("archive.blurb")}</p>
    </>
  );
}
