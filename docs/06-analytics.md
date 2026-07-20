# Analytics

Документ описывает фундамент аналитики MovieDNA.

Цель — единая система событий для PostHog (и опционально GA4) без протекания вендора в UI.

---

# Принципы

1. Единственная точка входа — `analytics.track(...)`.
2. UI / Engine не импортируют `posthog` / `gtag` напрямую.
3. Отсутствие ключей не ломает игру.
4. `track` только в браузере (SSR-safe).

---

# Common properties

Каждое событие автоматически получает:

| Поле | Описание |
|------|----------|
| `challengeId` | Текущий Challenge или `null` |
| `locale` | `ru` \| `en` |
| `regionsOpened` | Открытые Reveal Regions |
| `hintsUsed` | = `regionsOpened` |
| `attempts` | Число попыток |
| `deviceType` | `mobile` \| `tablet` \| `desktop` |
| `screenWidth` / `screenHeight` | Viewport |
| `movieId` | ID фильма Challenge |
| `movieTitle` | Название (EN предпочтительно) |
| `movieYear` | Год |
| `genres` | Строка через запятую или `null` (если нет в JSON) |
| `secondsToFirstGuess` | Сек. до первой непустой попытки или `null` |

На `region_opened` / `hint_used` дополнительно: `timeBetweenRegions` (сек. с прошлого региона или со старта).

---

# Список событий

| Display name | Event name | Когда |
|--------------|------------|--------|
| Session Started | `session_started` | Первый заход во вкладку |
| Session Ended | `session_ended` | `visibilitychange` hidden / `pagehide` |
| Home Open | `home_open` | Маршрут `/` |
| Archive Opened | `archive_opened` | Маршрут `/archive` |
| Challenge Started | `challenge_started` | Engine start |
| Region Opened | `region_opened` | Открыта область (+ `timeBetweenRegions`) |
| Hint Used | `hint_used` | То же действие, что Region Opened |
| Guess Submitted | `guess_submitted` | Любая отправка ответа |
| Correct Guess | `correct_guess` | Верный ответ |
| Wrong Guess | `wrong_guess` | Неверный ответ |
| Challenge Completed | `challenge_completed` | Победа |
| Challenge Failed | `challenge_failed` | Поражение / сдача |
| Challenge Abandoned | `challenge_abandoned` | Начал, ушёл до конца |
| Recommendation Click | `recommendation_click` | CTA «Киномарафон» |
| Recommendation Viewed | `recommendation_viewed` | Открыл страницу подборки |
| Movie Selected | `movie_selected` | Тап по фильму в подборке |
| Language Changed | `language_changed` | RU/EN |
| Image Viewer Opened | `image_viewer_opened` | Fullscreen кадра |
| Share Click | `share_click` | Share |
| Moment Of Recognition | `moment_of_recognition` | Самоотчёт после игры |

Дополнительно: `page_view`, `challenge_give_up`.

---

# Ключевые продуктовые метрики

- **challenge_abandoned** — бросил после старта; смотреть вместе с `movieTitle` / `movieId`.
- **secondsToFirstGuess** — скорость первой гипотезы.
- **timeBetweenRegions** — где «застрял» между подсказками.
- **moment_of_recognition** — на каком регионе узнал фильм (опрос после результата).
- **image_viewer_opened** — использование зума; коррелировать с победой / фильмом.

---

# Подключение PostHog

Локально — `.env.local` (не в git). На Vercel — Project Settings → Environment Variables (Production + Preview):

```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

После добавления на Vercel нужен **Redeploy** (`NEXT_PUBLIC_*` вшиваются на build).

Цепочка: `AnalyticsBootstrap` регистрирует `PostHogProvider` → `warm()`/`posthog.init` → каждый `analytics.track` → `posthog.capture`.

Опционально GA4: `NEXT_PUBLIC_GA_MEASUREMENT_ID`.

Файлы: `src/analytics/*`, `src/components/analytics/AnalyticsBootstrap.tsx`, `docs/06-analytics.md`.

---

# Internal dashboard

URL (только local / non-production): [`/analytics/dev`](/analytics/dev)

Читает локальное зеркало событий (`localStorage`), которое пишет каждый `analytics.track`.

Показывает:

- Completion / avg regions / hints / attempts / time
- **Region distribution** — на каком регионе закончили
- **Drop-off** — воронка по открытию регионов
- **Movies table** — Completion · Avg Regions · Avg Time · Avg Attempts
- **Heatmap** — 🟢 easy / 🟡 normal / 🔴 too hard
- **Recognition vs Actual** — поняли vs угадали
- Most abandoned

Это не админка и не BI — ответы на: что переделать, где уходят, какой баланс, что изменилось после апдейта.
