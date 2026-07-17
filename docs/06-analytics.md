# Analytics

Документ описывает фундамент аналитики MovieDNA.

Цель — единая система событий, которую могут потреблять GA4, Microsoft Clarity, Supabase и другие сервисы, без протекания деталей конкретного вендора в UI.

---

# Принципы

1. UI и игровой код не знают про `gtag`, Clarity или SQL.
2. Единственная точка входа — `analytics.track(...)`.
3. Провайдеры подключаются снаружи и могут меняться независимо.
4. Отсутствие ключей / сбой провайдера не ломает игру.
5. Геймплей и Engine не зависят от аналитики.

---

# Архитектура

```
UI / hooks
    │
    ▼
analytics.track(event, payload)     ← единственный публичный API
    │
    ▼
Analytics (fan-out)
    ├── GAProvider          (сейчас)
    ├── ClarityProvider     (позже)
    └── SupabaseProvider    (позже)
```

Файлы:

| Путь | Назначение |
|------|------------|
| `src/analytics/events.ts` | Типы событий и payload |
| `src/analytics/Analytics.ts` | Singleton + `track` / `register` |
| `src/analytics/providers/ga.ts` | Google Analytics 4 (gtag) |
| `src/analytics/providers/types.ts` | Контракт `AnalyticsProvider` |
| `src/analytics/index.ts` | Публичные экспорты |
| `src/components/analytics/AnalyticsBootstrap.tsx` | Загрузка gtag + `page_view` |

---

# Почему UI не должен знать о сервисе

Если компоненты вызывают `window.gtag` напрямую:

- невозможно подключить второй сервис без правок по всему коду;
- тесты и SSR становятся хрупкими;
- смена GA → Clarity = массовый рефакторинг.

С `analytics.track`:

- presentation layer остаётся чистым;
- новый Provider = одна регистрация;
- события типизированы в одном месте (`events.ts`).

---

# Providers

Каждый Provider реализует:

```ts
interface AnalyticsProvider {
  readonly name: string;
  track(event: AnalyticsEventName, properties: AnalyticsProperties): void;
}
```

Правила:

- `track` не бросает исключения наружу;
- без Measurement ID / SDK Provider либо не регистрируется, либо no-op;
- имя (`ga4`, …) уникально — повторная регистрация игнорируется.

## GAProvider (сейчас)

- читает `NEXT_PUBLIC_GA_MEASUREMENT_ID`;
- использует официальный `gtag.js`;
- `send_page_view: false` в config — page view идёт только через наш `analytics.track("page_view")`.

## ClarityProvider / SupabaseProvider (позже)

Слот зарезервирован. Реализация — отдельные PR, без изменения публичного API `track`.

---

# Список событий

| Событие | Назначение | Payload (основное) |
|---------|------------|--------------------|
| `page_view` | Просмотр маршрута | `path`, `title?` |
| `challenge_started` | Игрок нажал «Начать» | `challengeId`, `date?` |
| `challenge_completed` | Победа | `challengeId`, `movieScore` |
| `challenge_failed` | Поражение (неверный ответ на полном reveal) | `challengeId` |
| `challenge_give_up` | Нажатие «Сдаться» | `challengeId` |
| `reveal_opened` | Открыта следующая подсказка | `challengeId`, `regionIndex` |
| `guess_submitted` | Любая отправка ответа | `challengeId` |
| `guess_correct` | Верный ответ | `challengeId` |
| `guess_wrong` | Неверный ответ | `challengeId` |
| `archive_opened` | Открыт раздел Архив | — |
| `challenge_shared` | Share результата | `challengeId`, `movieScore?` |

Типы и обязательность полей — в `src/analytics/events.ts`.

---

# Публичный API

```ts
import { analytics } from "@/analytics";

analytics.track("guess_wrong", {
  challengeId: "challenge-joker",
  openedRegionCount: 2,
});

analytics.track("challenge_completed", {
  challengeId: "challenge-joker",
  movieScore: 920,
});

analytics.track("archive_opened");
```

TypeScript проверяет имя события и форму payload.

---

# Подключение GA4

1. Создай property в Google Analytics 4 и скопируй Measurement ID (`G-XXXXXXXX`).
2. Добавь в `.env.local`:

```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

3. Перезапусти Next.js.

Без переменной:

- скрипты GA не грузятся;
- `AnalyticsBootstrap` рендерит `null`;
- вызовы `track` безопасны (нет провайдеров → no-op).

Пример также в `.env.example`.

---

# Что делает этот PR / что нет

**Делает:**

- модуль Analytics + типы событий;
- GAProvider;
- автоматический только `page_view` при смене маршрута.

**Не делает:**

- вызовы `challenge_*` / `guess_*` / `reveal_*` из игрового UI;
- Clarity / Supabase;
- изменение Engine или геймплея.

Инструментирование игровых событий — следующий PR (после подтверждения).

---

# Следующий шаг (отдельный PR)

Подключить `analytics.track` в presentation layer в точках:

- старт Challenge;
- открытие Reveal;
- submit / correct / wrong guess;
- complete / fail / give up;
- archive open;
- share.

Без изменения игровой логики — только вызовы рядом с уже существующими UI-handlers.
