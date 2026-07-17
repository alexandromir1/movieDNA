# MovieDNA

MovieDNA — ежедневная игра, в которой пользователи угадывают известные фильмы по специально созданным художественным изображениям.

Проект использует собственные иллюстрации вместо кадров фильмов.

---

# Documentation

Документация разделена по темам.

01-vision.md
Описание продукта, целей и философии.

02-gameplay.md
Игровые механики.

03-economy.md
Очки, стрик, достижения, баланс.

04-content.md
Создание изображений и контента.

05-admin.md
Админ-панель.

06-analytics.md
Аналитика: события, Providers, GA4.

06-api.md
Backend API.

07-database.md
Структура базы данных.

08-roadmap.md
План разработки.

09-feature-registry.md
Полный список функций проекта.

CHANGELOG.md
История изменений.

---

# Development Principles

Перед реализацией новой функции необходимо:

1. Проверить, существует ли описание функции в документации.
2. Если функции нет — сначала обновить документацию.
3. Только после этого приступать к разработке.

Документация является единственным источником истины (Single Source of Truth).

---

# Technology Stack

Frontend

- Next.js
- React
- TypeScript
- TailwindCSS

Backend

- Supabase

Storage

- Supabase Storage

Authentication

- Supabase Auth

Deployment

- Vercel

---

# Project Structure

/app
/components
/lib
/hooks
/types
/docs
/public
/supabase

---

# Current Development Stage

Current Version

MVP

Current Goal

Подготовить полностью рабочую первую публичную версию продукта.

---

# Important

Любые изменения логики игры должны сначала отражаться в документации.

Код всегда следует документации.

# Glossary

Для обеспечения единообразия документации и кода используются следующие термины.

| Термин | Описание |
|---------|----------|
| Movie | Информация о фильме (название, год, aliases). |
| Level | Игровой контент: изображение, Reveal Regions, accepted answers. |
| Challenge | Публикация Level на конкретную UTC-дату. |
| Game | Сессия прохождения Challenge игроком. |
| Reveal Region | Заранее определенная область изображения, открывающаяся по мере прохождения. |
| Image Viewer | Просмотрщик с zoom/pan (Version 1.1). |
| Hint | Действие открытия следующей Reveal Region. |
| Guess | Попытка игрока угадать фильм. |
| Archive | Раздел с ранее опубликованными Challenge. |
| Streak | Дни подряд с успешным завершением ежедневного Challenge. |
| Movie Score | Очки за прохождение одного Challenge. |