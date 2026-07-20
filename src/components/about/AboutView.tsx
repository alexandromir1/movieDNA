"use client";

import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { GAME_ROUTES } from "@/lib/game/constants";
import { useLocale } from "@/lib/i18n/LocaleProvider";

const HOW_STEP_KEYS = ["1", "2", "3", "4", "5"] as const;

const FAQ_KEYS = [
  "notCounted",
  "replay",
  "howOften",
  "pvp",
  "suggest",
] as const;

function AboutSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-16 border-t border-white/[0.06] pt-10">
      <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
        {title}
      </h2>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-white/60 sm:text-base">
        {children}
      </div>
    </section>
  );
}

/**
 * Информационный раздел для первого знакомства с MovieDNA.
 * Тексты — только из i18n-словарей.
 */
export function AboutView() {
  const { t } = useLocale();

  return (
    <article className="mx-auto w-full max-w-2xl pb-16">
      <header className="pt-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/35">
          MovieDNA
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {t("about.heroTitle")}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-white/55 sm:text-lg">
          {t("about.heroBody")}
        </p>
        <Link href={GAME_ROUTES.today} className="mt-8 inline-block">
          <Button size="lg" className="h-12 px-8 text-base font-semibold">
            {t("about.playCta")}
          </Button>
        </Link>
      </header>

      <div className="mt-14 space-y-12">
        <AboutSection id="how" title={t("about.howTitle")}>
          <ol className="list-none space-y-3">
            {HOW_STEP_KEYS.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-xs font-semibold text-white/70">
                  {index + 1}
                </span>
                <span>{t(`about.howSteps.${step}`)}</span>
              </li>
            ))}
          </ol>
        </AboutSection>

        <AboutSection id="daily" title={t("about.dailyTitle")}>
          <p>{t("about.dailyBody")}</p>
        </AboutSection>

        <AboutSection id="archive" title={t("about.archiveTitle")}>
          <p>{t("about.archiveBody")}</p>
        </AboutSection>

        <AboutSection id="collections" title={t("about.collectionsTitle")}>
          <p>{t("about.collectionsBody")}</p>
        </AboutSection>

        <AboutSection id="philosophy" title={t("about.philosophyTitle")}>
          <p>{t("about.philosophyBody")}</p>
        </AboutSection>

        <AboutSection id="faq" title={t("about.faqTitle")}>
          <div className="space-y-2">
            {FAQ_KEYS.map((key) => (
              <details
                key={key}
                className="group rounded-[12px] border border-white/[0.08] bg-white/[0.02] px-4 py-3"
              >
                <summary className="cursor-pointer list-none text-sm font-medium text-white/90 marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between gap-3">
                    {t(`about.faq.${key}Q`)}
                    <span
                      className="text-white/30 transition-transform group-open:rotate-180"
                      aria-hidden
                    >
                      ▾
                    </span>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-white/50">
                  {t(`about.faq.${key}A`)}
                </p>
              </details>
            ))}
          </div>
        </AboutSection>
      </div>

      <div className="mt-12 text-center">
        <Link href={GAME_ROUTES.today} className="inline-block">
          <Button size="lg" className="h-12 px-8 text-base font-semibold">
            {t("about.playCta")}
          </Button>
        </Link>
      </div>
    </article>
  );
}
