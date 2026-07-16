export const siteConfig = {
  name: "MovieDNA",
  description: "Ежедневная игра — угадай фильм по визуальной ДНК",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  /** Первый день Daily Challenge (UTC) */
  dailyLaunchDate: "2026-01-01",
} as const;
