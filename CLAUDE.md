# CLAUDE.md

## Проект

Система управления индивидуальными KPI-картами сотрудников уровней CEO-1 и CEO-2 микрофинансовой компании (активы 10 млрд руб.). Целевая аудитория: ~20 топ-менеджеров, CFO как основной пользователь. Функции: формирование KPI-карт, ввод и согласование фактов, расчёт вознаграждения, моделирование запускающей цели.

**Это v2.0 — миграция с React+Vite на Next.js 15 + TypeScript strict + Tailwind CSS + shadcn/ui.**

## Тир workflow

**STANDARD** — определён по VIBE_CODING_WORKFLOW.md.
Критерии: ~20 пользователей с данными зарплат (PII), финансовые расчёты, срок жизни — годы, регрессии нежелательны.
Полный workflow — в `.claude/VIBE_CODING_WORKFLOW.md`.

## Стек

| Компонент | Технология |
|---|---|
| Frontend | Next.js 15 (App Router) + TypeScript strict |
| UI-компоненты | shadcn/ui (dark only) |
| Стили | Tailwind CSS v4 |
| Шрифты | Geologica (основной) + JetBrains Mono (числа, коды) |
| Иконки | lucide-react |
| Backend / БД | Supabase (PostgreSQL + Auth + RLS enforced) |
| Data fetching | TanStack Query v5 |
| Формы | React Hook Form + Zod |
| Excel | xlsx (импорт участников) |
| Тестирование | Vitest + Testing Library |
| Хостинг | Vercel |
| Аутентификация | Supabase Auth (email/password) |

_Технические решения: Vitest выбран как нативный для Vite/Next.js ecosystem; Zod+RHF — стандарт для TS-проектов; TanStack Query v5 — управление server state с кешированием._

`VIBE_FRAMEWORK_PATH=C:\Work\ИИ\Проекты\KPI\Repository\Vibe-coding-framework`

## Обязательное чтение

Перед любой работой прочитай:
1. `.claude/VIBE_CODING_WORKFLOW.md` — процесс, тиры, триггеры
2. Этот файл (`CLAUDE.md`) — правила проекта
3. `KPI_System_Technical_Specification.md` — бизнес-логика, формулы, роли (v2.0)
4. `UI_PATTERNS.md` — принятые UI-решения (shadcn/ui компоненты)
5. `PROJECT_CONTEXT.md` — карта файлов, текущий статус

## Активированные механизмы

**Agents (STANDARD tier):**
- `planner` — сложные фичи, рефакторинг (запускается перед реализацией)
- `code-reviewer` — после каждого написанного кода
- `security-reviewer` — перед коммитами с auth/API/user input
- `database-reviewer` — при написании SQL или миграций
- `build-error-resolver` — при ошибках сборки

**Skills:**
- `coding-standards` — стандарты кода проекта
- `search-first` — поиск перед реализацией
- `verification-loop` — проверка результатов

**Commands:**
- `/update-docs` — обновление живых документов после merge
- `/commit` — создание коммита по conventional commits

## Структура модулей

```
src/
├── app/                    # Next.js App Router: layouts, pages, API routes
│   ├── (auth)/             # Группа маршрутов: вход
│   ├── (dashboard)/        # Группа маршрутов: все авторизованные страницы
│   └── api/                # Server-side API routes
├── features/               # Бизнес-доменные модули
│   ├── auth/               # Аутентификация, сессия, профиль
│   ├── dashboard/          # Role-specific dashboards (admin/approver/participant)
│   ├── kpi-cards/          # KPI-карты: список, детальный просмотр, согласование
│   ├── kpi-library/        # Библиотека KPI-шаблонов (CRUD)
│   ├── trigger-goals/      # Запускающие цели (мастер-карты)
│   ├── participants/       # Управление участниками
│   ├── approvals/          # Страница согласования (approver)
│   ├── dictionaries/       # Справочники
│   ├── archive/            # Архив утверждённых карт
│   ├── events/             # Лента событий
│   ├── profile/            # Мой профиль, смена пароля
│   └── shared/             # Общие компоненты, хуки, утилиты
├── lib/                    # Утилиты и бизнес-логика
│   ├── calculations.ts     # КЛЮЧЕВОЙ: все формулы расчёта KPI
│   ├── supabase/           # Клиенты Supabase (browser + server)
│   └── utils.ts            # Утилиты
├── hooks/                  # Глобальные хуки (useAuth и др.)
├── types/                  # TypeScript типы, ViewModel-интерфейсы
└── components/             # Переопределения/расширения shadcn/ui (если нужны)
```

**Модульные границы:** каждый модуль в `features/` экспортирует только через `index.ts`. Импорт из внутренностей чужого модуля запрещён.

## Правила работы

1. Перед реализацией новой фичи — спроси, что именно нужно. Не додумывай.
2. Перед изменением файла — прочитай его актуальную версию.
3. Не устанавливай новые npm-пакеты без подтверждения.
4. Не удаляй и не переписывай работающий код без объяснения причины.
5. Обрабатывай ошибки явно. Не оставляй catch пустым.
6. Общие константы — в `src/lib/utils.ts` или тематических файлах в `src/lib/`, не дублируй.
7. Новые UI-решения должны соответствовать `UI_PATTERNS.md`. Новое — зафиксируй.
8. Все расчёты KPI — только в `src/lib/calculations.ts`. Никакой формульной логики в компонентах.
9. Компоненты принимают ViewModel-типы из `src/types/`, не сырые строки из БД.
10. Server Components по умолчанию, Client Components — только при необходимости (`"use client"`).

## Работа с базой данных

**Pipeline (обязательный, без исключений):**
1. Интроспекция — читай актуальную схему через Supabase MCP или SQL Editor
2. Проверка зависимостей данных — `SELECT COUNT` перед деструктивными операциями
3. Проверка зависимостей в коде — grep по кодовой базе
4. Оценка безопасности — если деструктивная операция при наличии зависимостей — сначала мигрировать данные
5. Создать rollback SQL → сохранить в `supabase/rollbacks/YYYY-MM-DD-description-rollback.sql`
6. Выполнить SQL
7. Верификация — перечитать схему
8. Обновить код

**Два Supabase-клиента:**
- `src/lib/supabase/browser.ts` — браузерный (anon key), для Client Components
- `src/lib/supabase/server.ts` — серверный (service_role, `persistSession: false`), для Server Components и API routes

**RLS как primary gate** — application code как вторичный уровень.

**Запрещено:**
- `DROP TABLE` — только soft delete (`is_active = false`) или rename
- `TRUNCATE` — запрещено
- SQL на основе документации вместо актуальной схемы — запрещено
- Прямые изменения auth-схемы — только через Auth API или Dashboard

## Build & Dev

```bash
npm install          # Установка зависимостей
npm run dev          # Запуск dev-сервера (http://localhost:3000)
npm run build        # Production сборка
npm run lint         # ESLint
npx tsc --noEmit    # TypeScript typecheck
npm run test         # Vitest (watch mode)
npm run test -- --run  # Vitest (single run, для CI)
```

## CI

GitHub Actions: `.github/workflows/ci.yml`
Pipeline: lint → typecheck → test → build
STANDARD tier: CI информационный — не блокирует merge.

## Git

- Ветки: `feature/название` для фич, `fix/описание` для исправлений
- Коммиты на английском: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
- Пример: `feat: add kpi-card approval workflow`

## Живые документы

Обновляются через `/update-docs` после каждого merge:
- `PROJECT_CONTEXT.md` — карта файлов, статус, инфраструктура
- `KPI_System_Technical_Specification.md` — бизнес-логика (если менялась)
- `UI_PATTERNS.md` — UI-решения (если новые)
- `CODE_LEARNINGS.md` — паттерны и learnings кодовой базы

> **Примечание:** Framework-level паттерны (нетривиальное поведение API, workarounds) записываются в `.claude/workflow/LEARNED_PATTERNS.md`, а не в CODE_LEARNINGS.md.

## Запрещено

- inline styles (кроме единичных динамических значений)
- `!important`
- `console.log` в production коде
- Хардкод значений, которые должны быть настраиваемыми
- Дублирование констант и утилит между файлами
- Пустые catch-блоки
- `any` в TypeScript (используй `unknown` или явные типы)
- Прямые запросы к БД в компонентах (только через хуки или server actions)
- Импорт из внутренностей чужого `features/` модуля
- Мутация объектов — только иммутабельные паттерны
