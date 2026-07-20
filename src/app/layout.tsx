import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { PersistenceGuard } from "@/components/PersistenceGuard";
import { AnalyticsBootstrap } from "@/components/analytics/AnalyticsBootstrap";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { siteConfig } from "@/config/site";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";
import { getRequestLocale } from "@/lib/i18n/server";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-[#0e0e10] font-sans text-white">
        <LocaleProvider initialLocale={locale}>
          <AnalyticsBootstrap />
          <PersistenceGuard>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </PersistenceGuard>
        </LocaleProvider>
      </body>
    </html>
  );
}
