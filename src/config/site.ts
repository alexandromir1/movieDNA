export const siteConfig = {
  name: "MovieDNA",
  /** Fallback description; UI uses locales via LocaleProvider */
  description: "Ежедневная игра — угадай фильм по визуальной ДНК",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  /** Первый день Daily Challenge (UTC) */
  dailyLaunchDate: "2026-01-01",
  /** Публичный репозиторий (footer). Пустая строка — ссылка скрыта. */
  githubUrl: process.env.NEXT_PUBLIC_GITHUB_URL ?? "https://github.com/alexandromir1/movieDNA",
  /** Контакт в footer (mailto). */
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@moviedna.app",
} as const;
