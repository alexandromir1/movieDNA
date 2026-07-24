# Analytics V2 — Case Analytics

Единый каталог событий расследования MovieDNA v2.

**Принципы**

1. Один пайплайн с V1: `AnalyticsBootstrap` → `analytics.track` → PostHog / GA.
2. События V1 (`challenge_*`, `guess_*`, …) **не меняем** — они для Daily.
3. V2 шлёт **Case Analytics** с префиксами доменов: Home / Investigation / Archive / Recommendations / Campaign.
4. Presentation only — Engine / Progress / Reveal не знают про PostHog.

Контекст дела (presentation): `src/lib/v2/case-analytics.ts`.

---

## Общие свойства расследования

Почти все события Investigation (+ archive / related / campaign, где уместно) несут:

| Свойство | Тип | Смысл |
|----------|-----|--------|
| `caseNumber` | number | Порядковый номер дела: `1`, `15`, `327` — **не** levelId |
| `gameMode` | enum | `campaign` \| `deferred` \| `archive` \| `daily` \| `pvp` |
| `enteredFrom` | enum | `home` \| `archive` \| `campaign_complete` \| `recommendations` \| `deeplink` \| `continue` |
| `challengeId` | string | Сейчас = `level.id` (технический id дела) |
| `movieId` | string | Id фильма |

Плюс **common properties** из `buildCommonProperties()` (автоматически):

`locale`, `attempts`, `regionsOpened`, `hintsUsed`, `movieTitle`, `movieYear`, `genres`, `deviceType`, `screenWidth`, `screenHeight`, `secondsToFirstGuess`.

На завершении: `secondsPlayed` (elapsed time сессии дела).

`gameMode` уже сейчас заполняется (`campaign` / `deferred` / `archive`); `daily` и `pvp` зарезервированы.

---

## Home

### `home_open`

**Когда:** открыт кабинет `/v2` (и также `/` для V1).

**Свойства:** common only.

### `start_button_clicked`

**Когда:** нажата папка дела на главной (старт / продолжить расследование).

**Свойства:** common. Перед кликом выставляется `enteredFrom: home`, `gameMode: campaign`.

### `language_changed`

**Когда:** переключатель языка на полке.

**Свойства:** `locale`, `previousLocale`.

---

## Investigation

### `case_started`

**Когда:** дело загружено и готово к игре на `/v2/game`.

**Свойства:** `caseNumber`, `gameMode`, `enteredFrom`, `challengeId`, `movieId` + common.

### `case_fragment_opened`

**Когда:** игрок нажал «Изучить новую улику».

**Свойства:** `regionIndex`, `timeBetweenRegions?` + Case Analytics + common.

### `case_guess_submitted`

**Когда:** отправлена непустая догадка.

**Свойства:** `guessLength`, `attemptCount` + Case Analytics + common.

### `case_guess_correct`

**Когда:** вердикт верен.

**Свойства:** `openedRegionCount`, `attemptCount` + Case Analytics + common.

### `case_guess_wrong`

**Когда:** версия не подтверждается.

**Свойства:** `openedRegionCount`, `attemptCount` + Case Analytics + common.

### `case_deferred`

**Когда:** «Отложить дело».

**Свойства:** `openedRegionCount`, `attemptCount` + Case Analytics + common.

### `case_give_up`

**Когда:** «Закрыть без вердикта».

**Свойства:** `openedRegionCount`, `secondsPlayed` + Case Analytics + common.

### `case_completed`

**Когда:** дело успешно закрыто (победа).

**Свойства:** `openedRegionCount`, `secondsPlayed` + Case Analytics + common.

### `search_used`

**Когда:** выбран фильм из списка совпадений (общий `MovieSearchInput`).

**Свойства:** как в V1 (`queryLength`, `resultsCount`, `selectedMovieId`, …) + common.

---

## Archive

### `archive_opened`

**Когда:** маршрут `/v2/archive` (и `/archive` для V1).

### `archive_case_opened`

**Когда:** в архиве открыты материалы закрытого дела (клик «Похожие дела»).

**Свойства:** `caseNumber`, `gameMode: archive`, `enteredFrom: archive`, `challengeId`, `movieId`.

### `archive_case_resumed`

**Когда:** возобновлено отложенное дело из архива.

**Свойства:** `caseNumber`, `gameMode: deferred`, `enteredFrom: archive`, `challengeId`.

---

## Recommendations (киномарафон / похожие дела)

### `related_cases_opened`

**Когда:** на экране результата показана ссылка «Похожие дела».

**Свойства:** `source: result`, Case Analytics, `movieId`, `challengeId`.

### `related_cases_clicked`

**Когда:** клик по «Похожие дела» (результат или архив).

**Свойства:** `source: result | archive`, `href`, Case Analytics.

Навигация назад с киномарафона:

- из результата → `/v2/game` с восстановлением модалки победы;
- из архива → `/v2/archive`.

(через `storeV2Return` / `storeV2Result`, presentation only.)

Существующие V1 `recommendation_viewed` / `recommendation_clicked` на странице `/movie/.../recommendations` **не трогаем**.

---

## Campaign

### `campaign_completed`

**Когда:** открыт экран завершения основной кампании.

**Свойства:** `deferredRemaining?` + Case Analytics meta (если была).

### `campaign_resume_deferred`

**Когда:** CTA «Вернуться к нераскрытым делам».

**Свойства:** `deferredRemaining?`; выставляет `enteredFrom: campaign_complete`, `gameMode: deferred`.

---

## Воронка V2

```text
home_open
  → start_button_clicked
  → case_started
  → case_fragment_opened*
  → case_guess_submitted*
  → case_guess_correct | case_guess_wrong*
  → case_completed | case_deferred | case_give_up
  → related_cases_opened → related_cases_clicked
  → archive_opened → archive_case_opened | archive_case_resumed
  → campaign_completed → campaign_resume_deferred
```

---

## Почему так названо

| Вместо (смесь) | Case Analytics |
|----------------|----------------|
| `challenge_started` (V2) | `case_started` |
| `region_opened` (V2) | `case_fragment_opened` |
| `guess_*` (V2) | `case_guess_*` |
| `deferred_case_opened` | `archive_case_resumed` |

Через год рядом лягут `pvp_match_started`, `daily_case_started` без переименования ядра.

---

## Файлы

| Файл | Роль |
|------|------|
| `src/analytics/events.ts` | Каталог имён и payload |
| `src/lib/v2/case-analytics.ts` | `caseNumber` / `gameMode` / `enteredFrom` + return path |
| `src/components/v2/*` | Точки `track` |
| `src/components/analytics/AnalyticsBootstrap.tsx` | `home_open` / `archive_opened` для `/v2*` |
| `docs/06-analytics.md` | V1 + общая архитектура |
| `docs/analytics-v2.md` | Этот документ |
