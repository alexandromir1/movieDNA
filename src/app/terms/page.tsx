import type { Metadata } from "next";

import { LegalDocView } from "@/components/about/LegalDocView";
import { Container } from "@/components/layout/Container";
import { siteConfig } from "@/config/site";
import { getRequestLocale } from "@/lib/i18n/server";
import { en } from "@/locales/en";
import { ru } from "@/locales/ru";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = locale === "en" ? en.legal : ru.legal;

  return {
    title: copy.termsTitle,
    description: copy.termsMeta,
    alternates: { canonical: `${siteConfig.url}/terms` },
  };
}

export default function TermsPage() {
  return (
    <Container className="max-w-3xl">
      <LegalDocView kind="terms" />
    </Container>
  );
}
