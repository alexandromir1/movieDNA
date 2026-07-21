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

Payload события может дублировать `locale` / `challengeId` / `deviceType` — они всё равно приходят из common layer.

---

# Список событий

| Display name | Event name | Properties | When fired |
|--------------|------------|------------|------------|
| Session Started | `session_started` | — | Первый заход во вкладку |
| Session Ended | `session_ended` | `durationSeconds` | `visibilitychange` hidden / `pagehide` |
| Page View | `page_view` | `path`, `title?` | Смена маршрута |
| Home Open | `home_open` | — | Маршрут `/` |
| Start Button Clicked | `start_button_clicked` | — | Клик «Играть сегодня» на главной |
| Archive Opened | `archive_opened` | — | Маршрут `/archive` |
| Challenge Started | `challenge_started` | `challengeId`, `startedFromRecommendation?`, `recommendedMovieId?`, `recommendedMovieTitle?` | Engine start; если до старта был клик по рекомендации — `startedFromRecommendation: true` |
| Region Opened | `region_opened` | `challengeId`, `regionIndex`, `regionId`, `timeBetweenRegions?` | Открыта область |
| Hint Used | `hint_used` | то же, что `region_opened` | То же действие, что Region Opened |
| Guess Submitted | `guess_submitted` | `challengeId`, `guessLength`, `attemptCount` | Любая отправка ответа |
| Correct Guess | `correct_guess` | `challengeId`, `openedRegionCount`, `attemptCount` | Верный ответ |
| Wrong Guess | `wrong_guess` | `challengeId`, `openedRegionCount`, `attemptCount` | Неверный ответ |
| Challenge Completed | `challenge_completed` | `challengeId`, `movieScore`, `openedRegionCount`, `secondsPlayed` | Победа |
| Challenge Failed | `challenge_failed` | `challengeId`, `openedRegionCount`, `secondsPlayed` | Поражение / сдача |
| Challenge Give Up | `challenge_give_up` | `challengeId`, `openedRegionCount` | Сдача (дублируется в `challenge_failed`) |
| Challenge Abandoned | `challenge_abandoned` | `challengeId`, `openedRegionCount`, `attemptCount`, `secondsPlayed` | Начал, ушёл до конца |
| Search Used | `search_used` | `queryLength`, `resultsCount`, `selectedMovieId`, `selectedMovieTitle`, `selectedMovieYear?` | Выбран фильм из dropdown (не на каждый символ) |
| Recommendation Viewed | `recommendation_viewed` | `currentMovieId`, `currentMovieTitle`, `recommendedMovieId?`, `recommendedMovieTitle?`, `recommendationSection?`, `position?` | Блок киномарафона на экране результата или карточка фильма в подборке попала в viewport |
| Recommendation Clicked | `recommendation_clicked` | `currentMovieId`, `currentMovieTitle`, `recommendedMovieId`, `recommendedMovieTitle`, `recommendationSection`, `position` | Клик по конкретному фильму в подборке |
| Recommendation Click | `recommendation_click` | `challengeId`, `href` | CTA «Открыть подборку» на экране результата |
| Movie Selected | `movie_selected` | `movieId`, `movieTitle`, `movieYear` | *(legacy, заменён на `recommendation_clicked`)* |
| Language Changed | `language_changed` | `locale`, `previousLocale` | RU/EN |
| Image Viewer Opened | `image_viewer_opened` | `challengeId?` | Увеличение кадра Challenge |
| Share Click | `share_click` | `challengeId`, `movieScore` | Share |
| Moment Of Recognition | `moment_of_recognition` | `challengeId`, `regionIndex`, `answer` | Самоотчёт после игры |

---

# Воронки

## Home → Challenge

```
home_open
  ↓
start_button_clicked
  ↓
challenge_started
```

## Recommendations

```
recommendation_viewed   (блок на результате или карточка в подборке)
  ↓
recommendation_clicked  (клик по фильму)
  ↓
challenge_started       (startedFromRecommendation: true)
```

Атрибуция рекомендации хранится в `sessionStorage` до 30 минут и снимается один раз при следующем `challenge_started`.

---

# Ключевые продуктовые метрики

- **challenge_abandoned** — бросил после старта; смотреть вместе с `movieTitle` / `movieId`.
- **secondsToFirstGuess** — скорость первой гипотезы.
- **timeBetweenRegions** — где «застрял» между подсказками.
- **search_used** — насколько поиск помогает угадывать (длина запроса vs выбор).
- **recommendation_viewed → recommendation_clicked → challenge_started** — конверсия киномарафона.
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
