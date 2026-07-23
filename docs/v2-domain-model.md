# MovieDNA v2 — Domain Model

**Роль:** связующее звено между продуктом и кодом.  
Описывает **сущности игры, ownership, жизненные циклы и зависимости** — без фреймворка, JSON-схем и UI.

| Документ | Вопрос |
|----------|--------|
| [v2-game-loop.md](./v2-game-loop.md) | *Зачем* продукт устроен так |
| [v2-user-flow.md](./v2-user-flow.md) | *Как* игрок проходит экраны |
| [v2-first-run.md](./v2-first-run.md) | *Как* выглядит первый запуск |
| **Этот файл** | *Из чего* состоит мир и *кто чем владеет* |

**Правило:** новая «главная» сущность в коде → сначала этот документ.

**Статус архитектуры v2:** завершена. Дальше — только реализация небольшими PR. Новые архитектурные документы — лишь при реальном пробеле, который нельзя закрыть правкой существующих SoT.

Код не писать, пока не согласован минимальный PR.

---

## 1. Главная цепочка контента

Так добавляются Blur / Focus **без изменения смысла Level**:

```text
Movie
  │   информация о фильме
  ▼
Level
  │   конкретное испытание (что угадываем + картинка + сложность)
  ▼
RevealDefinition
  │   как именно раскрывается изображение (тип стратегии + контракт шагов)
  ▼
Fragments | Blur | Focus | Color | Light
      данные конкретной стратегии
```

| Слой | Отвечает на вопрос |
|------|-------------------|
| **Movie** | *Какой это фильм?* |
| **Level** | *Какое это испытание в очереди?* |
| **RevealDefinition** | *По какому правилу открывается картинка?* |
| **Fragments** (и др.) | *Какие конкретные данные у этой стратегии?* |

**Почему RevealDefinition отдельно от Level**

- Level остаётся стабильным: movie, image, difficulty, answers.  
- Смена способа раскрытия = другая RevealDefinition (или замена definition), а не перекройка Level.  
- Session работает с **контрактом** RevealDefinition («следующий шаг»), не с полями Fragments.

В v2.0 у каждого Level ровно одна RevealDefinition типа **Fragments**.

---

## 2. Карта домена (обзор)

```text
Player
 ├── Progress
 ├── Statistics
 ├── Streak                 ← не открывает Level
 └── Currency              ← будущее

LevelSequence
 └── Level → Level → …

Level
 ├── → Movie
 ├── image
 ├── difficulty
 ├── acceptedAnswers
 └── → RevealDefinition
          ├── kind: fragments | blur | …
          └── data: FragmentsDefinition | BlurDefinition | …

Session                    ← живая попытка
 ├── → Level
 ├── revealRuntime          ← openedSteps + strategy instance
 ├── attempts
 ├── timing
 └── → Result (когда закрылась)

Result
 └── снимок прохождения Level
```

---

## 3. Ownership (кто чем владеет)

Абсолютно ясно: сущность **владеет** данными; остальные только **ссылаются**.

### Movie владеет

- названием (локализованным);  
- годом;  
- жанрами (опционально);  
- aliases (для угадывания);  
- рекомендациями (киномарафон).

**Не владеет:** изображением загадки, фрагментами, сложностью, порядком в очереди, попытками игрока.

### Level владеет

- ссылкой на Movie;  
- изображением-источником испытания;  
- сложностью;  
- accepted answers;  
- **RevealDefinition** (как раскрывать *это* изображение).

**Не владеет:** прогрессом игрока, открытыми «прямо сейчас» шагами, попытками, рекомендациями фильма.

### RevealDefinition владеет

- типом стратегии (`fragments` / `blur` / …);  
- числом шагов (или способом его вычислить);  
- **данными стратегии** (см. ниже).

**Не владеет:** Movie, Progress, Session runtime (сколько уже открыто у игрока).

### FragmentsDefinition владеет (данные стратегии)

- упорядоченным списком фрагментов (геометрия / маски / крупные куски);  
- правилом порядка показа.

Аналогично позже: `BlurDefinition`, `FocusDefinition`, … — каждый владеет **только** своими параметрами.

### Session владеет

- ссылкой на текущий Level;  
- **открытыми шагами** (runtime: сколько уже revealNext);  
- попытками угадать;  
- временем сессии;  
- статусом (идёт / победа / ушёл / …).

**Не владеет:** контентом FragmentsDefinition (читает через Level → RevealDefinition); глобальным Progress (обновляет Progress через Engine при закрытии).

### Player владеет

- **Progress** (куда «Продолжить»);  
- **Statistics**;  
- Streak;  
- Currency (будущее).

**Не владеет:** контентом Level/Movie (только id пройденных).

### LevelSequence владеет

- упорядоченным списком Level id (глобальная очередь продукта).

### Result владеет

- снимком итога одной Session: шаги, попытки, время, score, ссылки на Level/Movie.

---

## 4. Жизненный цикл сущностей

### Movie

```text
создаётся один раз (контент)
    → публикуется в каталоге
    → используется многими Level
    → не «проходится» и не «завершается»
```

В норме: стабильная справочная сущность. Правки названия/aliases — контентные, не игровой цикл.

### Level

```text
создаётся (Studio / контент)
    → попадает в LevelSequence
    → ожидается игроком (Available)
    → проходится в Session
    → для игрока становится Completed (факт в Player.Progress)
```

Сам Level как контент **не удаляется** после прохождения; меняется только отношение Progress ↔ Level.

Статусы с точки зрения **игрока**:

| Статус | Смысл |
|--------|--------|
| Upcoming | Ещё впереди по Progress |
| Current | Следующий / активный |
| Completed | Уже пройден этим Player |

### RevealDefinition

```text
создаётся вместе с Level (или привязывается к Level)
    → неизменна во время Session
    → читается стратегией при старте Session
```

Не имеет статуса «completed» — completed относится к Level для игрока.

### FragmentsDefinition (и данные других стратегий)

```text
создаётся как часть RevealDefinition
    → не меняется во время игры
    → Session лишь считает, сколько шагов из неё уже открыто
```

### Session

```text
создаётся (старт Level)
    → идёт (VIEWING / GUESSING / REVEALING…)
    → закрывается (победа / уход / …)
    → порождает Result (если завершена осмысленно)
```

После закрытия Session не «продолжается»; новый Level = новая Session.

### Player.Progress

```text
создаётся при первом запуске
    → обновляется при Completed Level
    → живёт между сессиями бесконечно
    → не сбрасывается на главном пути v2.0
```

### Result

```text
создаётся при закрытии успешной (или сданной) Session
    → показывается на экране результата
    → может питает Statistics
    → архивируется в истории игрока (опционально)
```

---

## 5. Зависимости (кто о ком знает)

Стрелка `A → B` значит: **A знает о B** (ссылка / чтение). Обратной стрелки нет, если не указано.

### Игровой путь чтения контента

```text
Player
  → Progress
      → currentSequenceIndex
          → LevelSequence
              → Level
                  → Movie
                  → RevealDefinition
                      → FragmentsDefinition  (или Blur…)
```

### Живая игра

```text
Session
  → Level
      → Movie                 (название, aliases)
      → RevealDefinition
          → Fragments…        (статические данные)
  → revealRuntime             (openedSteps — владение Session)
  → Attempts
  → Timing
```

### После победы

```text
Session (закрывается)
  → Result
Engine
  → обновляет Player.Progress
  → обновляет Player.Statistics (агрегаты)
UI
  → Result + Movie (название)
  → CTA продолжения → новый Session по Progress
```

### Кто **не** должен знать о ком

| Сущность | Не знает о |
|----------|------------|
| Movie | Level, Session, Progress, Fragments |
| FragmentsDefinition | Player, Session, Progress |
| RevealDefinition | Player, Progress, какой «следующий Level» |
| Level | Progress конкретного игрока, Attempts |
| Session | LevelSequence целиком, Currency |
| Reveal runtime / strategy instance | PostHog, роутинг UI |

---

## 6. Сущности подробно

### 6.1. Player

```text
Player
 ├── Progress
 ├── Statistics
 ├── Streak
 └── Currency (future)
```

**Progress:** `currentSequenceIndex`, `completedLevelIds`, опц. `bestResultByLevel`, `unlockedRevealMethods` (v2.0 = только fragments).

**Statistics:** агрегаты за жизнь ≠ позиция в очереди.

**Streak:** не блокирует Level.

### 6.2. Movie

Справочник фильма. Ownership — §3.

### 6.3. Level

Испытание. Обязательно указывает на Movie и RevealDefinition.

### 6.4. RevealDefinition

```text
RevealDefinition
 ├── kind: fragments | blur | focus | color | light
 ├── stepCount (или эквивалент)
 └── data: стратегия-специфичные данные
```

Контракт для runtime (то, что реализует «стратегия» в Engine):

- totalSteps / openedSteps / canRevealNext / revealNext / viewState  

Без знания Progress и угадывания.

### 6.5. FragmentsDefinition

Данные kind=fragments: упорядоченные крупные куски.  
Игрок не выбирает кусок — только «следующий шаг».

### 6.6. LevelSequence

Глобальный порядок Level. Не календарь.

### 6.7. Session

Владеет runtime (§3). Эфемерна относительно Progress.

### 6.8. Result

Снимок завершения; не заменяет Progress.

---

## 7. Game Engine (координатор)

1. Progress + LevelSequence → текущий Level.  
2. Level → RevealDefinition → создать reveal runtime в Session.  
3. Команды: угадать / следующий шаг.  
4. Ответ ↔ AcceptedAnswers + Movie.aliases.  
5. Result → обновить Progress / Statistics.  
6. UI: результат → **CTA продолжения** (лейбл — TODO терминологии).

Engine знает контракт RevealDefinition; **не** хардкодит поля Fragments в логике угадывания.

### 7.1. Engine Boundaries

Границы для ревью PR. Engine — доменный координатор, не слой UI.

**Engine имеет право**

- создавать и вести **Session**;  
- читать **Level** → **RevealDefinition** и поднимать reveal **runtime**;  
- вызывать `revealNext` / читать view-state стратегии;  
- принимать команды угадывания и вести **Attempts**;  
- считать и отдавать **Result**;  
- обновлять **Player.Progress** и агрегаты **Statistics** после завершения Level;  
- сообщать о доменных событиях наружу через узкий порт (слой приложения → `analytics.track`), не зная PostHog.

**Engine не имеет права**

- импортировать React / знать о компонентах UI;  
- трогать DOM, CSS, анимации презентации;  
- вызывать PostHog, gtag или любой analytics vendor напрямую;  
- выполнять навигацию (router, `href`, deep links);  
- решать layout кнопок и копирайт экранов;  
- читать геометрию Fragments в обход контракта RevealDefinition / runtime;  
- выбирать «какой Level следующий» в обход Progress + LevelSequence.

**Кто снаружи**

- UI / hooks отправляют команды в Engine и рисуют по Snapshot / Result;  
- Analytics bootstrap подписывается на доменные события или вызывается application-слоем после Engine.

---

## 8. Связь с user states

| State | Домен |
|-------|--------|
| `NOT_STARTED` | Player + Progress; нет active Session |
| `VIEWING_FRAGMENT` | Session + revealRuntime |
| `GUESSING` | Session + Attempt в процессе |
| `REVEALING_NEXT` | Session.revealRuntime.openedSteps++ |
| `WRONG_GUESS` | Attempt записан; Session жива |
| `WON` / `RESULT` | Result; Progress к сдвигу |
| `BETWEEN_LEVELS` | Progress обновлён; новая Session |
| `AWAY` | Progress сохранён; Session сериализована или брошена |

---

## 9. Вне домена v2.0

| Идея | Статус |
|------|--------|
| Challenge + date | Legacy миграции |
| Archive как вторая прогрессия | Нет |
| Reveal Region как продукт | Нет → RevealDefinition |
| Выбор режима игроком | Нет |
| Paywall / energy | Нет |

---

## 10. Инварианты для ревью

1. Fragments / Blur живут **под** RevealDefinition, не в Movie и не в Session как контент.  
2. Session владеет только **openedSteps**, не геометрией фрагментов.  
3. Level не знает Progress игрока.  
4. Movie не знает Level.  
5. RevealDefinition не знает «какой Level следующий».  
6. Progress не привязан к календарю.  
7. Новая стратегия = новый kind + data, Level API стабилен.

---

## 11. Минимальный набор первого PR

- Movie + Level + RevealDefinition(kind=fragments) + FragmentsDefinition  
- Session (openedSteps, attempts)  
- без полного Progress/Sequence на проде (один Level за flag)  

---

## 12. Словарь

| Игрок | Домен |
|-------|--------|
| Фильм (название) | Movie |
| Уровень / испытание | Level |
| Фрагмент | шаг FragmentsDefinition через RevealDefinition |
| Открытые куски сейчас | Session.revealRuntime |
| Продолжить | Progress → Level |
| CTA продолжения | после Result → следующий Level |
| Киномарафон | Movie.Recommendations |

---

## 13. Формула

> **Movie** описывает фильм.  
> **Level** — испытание с картинкой и сложностью.  
> **RevealDefinition** — *как* открывается картинка.  
> **Fragments** (и позже Blur…) — *данные* этого способа.  
> **Session** владеет только ходом игры.  
> **Player** владеет прогрессом и статистикой.  
> Никто не владеет чужим.
