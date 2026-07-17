/** Форматирование дат Challenge для UI (UTC YYYY-MM-DD). */

const MONTHS_RU = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
] as const;

const WEEKDAYS_RU = [
  "воскресенье",
  "понедельник",
  "вторник",
  "среда",
  "четверг",
  "пятница",
  "суббота",
] as const;

function parseUtcDate(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/** «пятница, 17 июля 2026» — дата под логотипом (десктоп) */
export function formatHeaderDate(date: string = new Date().toISOString().split("T")[0]): string {
  const utc = parseUtcDate(date);
  const weekday = WEEKDAYS_RU[utc.getUTCDay()];
  const day = utc.getUTCDate();
  const month = MONTHS_RU[utc.getUTCMonth()];
  const year = utc.getUTCFullYear();
  return `${weekday}, ${day} ${month} ${year}`;
}

/** «17 июля» — компактная дата для мобильной шапки */
export function formatHeaderDateShort(
  date: string = new Date().toISOString().split("T")[0],
): string {
  const utc = parseUtcDate(date);
  return `${utc.getUTCDate()} ${MONTHS_RU[utc.getUTCMonth()]}`;
}

/** Короткий ярлык: Сегодня / Вчера / 15 июля */
export function formatSidebarDateLabel(
  date: string,
  today: string,
): string {
  if (date === today) return "Сегодня";

  const [ty, tm, td] = today.split("-").map(Number);
  const yesterday = new Date(Date.UTC(ty, tm - 1, td - 1))
    .toISOString()
    .split("T")[0];
  if (date === yesterday) return "Вчера";

  const utc = parseUtcDate(date);
  return `${utc.getUTCDate()} ${MONTHS_RU[utc.getUTCMonth()]}`;
}
