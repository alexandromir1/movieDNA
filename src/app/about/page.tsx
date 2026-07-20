import type { Metadata } from "next";

import { AboutView } from "@/components/about/AboutView";
import { Container } from "@/components/layout/Container";
import { siteConfig } from "@/config/site";
import { getRequestLocale } from "@/lib/i18n/server";
import { en } from "@/locales/en";
import { ru } from "@/locales/ru";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = locale === "en" ? en.about : ru.about;

  return {
    title: copy.metaTitle,
    description: copy.metaDescription,
    openGraph: {
      title: `${copy.metaTitle} · ${siteConfig.name}`,
      description: copy.metaDescription,
      url: `${siteConfig.url}/about`,
      siteName: siteConfig.name,
      type: "website",
    },
    alternates: {
      canonical: `${siteConfig.url}/about`,
    },
  };
}

/**
 * Informational hub for first-time visitors.
 * UI strings live in locales; this route is SEO-indexed.
 */
export default function AboutPage() {
  return (
    <Container className="max-w-3xl">
      <AboutView />
    </Container>
  );
}
