# PROJECT CONTEXT — KPI System v2
> Вставьте этот файл в начало нового чата для бесшовного продолжения разработки.
> Полное ТЗ по механикам — в `KPI_System_Technical_Specification.md`

---

## 1. ЧТО ЭТО ЗА ПРОЕКТ

Веб-приложение для управления индивидуальными KPI-картами сотрудников уровней CEO-1 и CEO-2. Разработка ведётся итеративно: вайбкодинг + пользовательское тестирование. Целевой пользователь — CFO микрофинансовой компании (активы 10 млрд руб.).

**v2 — полная миграция** с React 18 + Vite на Next.js 15 + TypeScript strict + shadcn/ui + Supabase. Новый Supabase-проект, новый репозиторий, новый деплой на Vercel.

---

## 2. ИНФРАСТРУКТУРА

| Сервис | Значение |
|---|---|
| GitHub репозиторий | `github.com/littlejonnny-ux/KPI-System-2` |
| Supabase проект | `kpi-system-2` (West EU — Ireland) |
| Supabase URL | `https://bqzjqrngjezqsaluupft.supabase.co` |
| Vercel URL | TBD |
| Admin логин | `admin` |
| Admin email в Supabase Auth | `admin@kpi.local` |

> Токены, ключи и пароли хранятся в `.env.local` (gitignored) и переменных окружения Vercel. Не добавлять в этот файл.

**Предыдущий проект (v1, только для справки):**
- GitHub: `github.com/littlejonnny-ux/KPI-System`
- Supabase: `oyzmbkohftzmtofyvkis.supabase.co`
- Vercel: `kpi-system-pi.vercel.app`

---

## 3. СТЕК

**Next.js 15 App Router + TypeScript strict + Tailwind CSS v4 + shadcn/ui + Supabase + TanStack Query v5**

| Слой | Технология |
|---|---|
| Framework | Next.js 15 App Router |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 + shadcn/ui (dark only) |
| Database / Auth | Supabase (PostgreSQL + RLS + Auth) |
| Server state | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Tests (unit) | Vitest + Testing Library |
| Tests (E2E) | Playwright (`@playwright/test`) |
| Deploy | Vercel |

- Вход: логин `admin` → `admin@kpi.local` → Supabase Auth signInWithPassword
- Дизайн-система: тёмная тема, шрифты Geologica + JetBrains Mono, акцент `#3b7dd8` (CSS переменная shadcn)
- Два Supabase клиента: browser (anon key) + server (service_role, persistSession: false)
- RLS enforced как primary gate, application code как secondary

---

## 4. СТРУКТУРА ФАЙЛОВ ПРОЕКТА

### 4.0 Документация (читать в начале каждой сессии)

**`PROJECT_CONTEXT.md`** (этот файл)
Контекст: инфраструктура, стек, структура модулей, статус. Обновлять раздел 7 после каждой сессии.

**`KPI_System_Technical_Specification.md`**
Живое ТЗ. Все бизнес-механики: роли, методы оценки, составность, карты, согласование, библиотека KPI, справочники. При реализации новых механик — обновлять напрямую.

**`UI_PATTERNS.md`**
Справочник принятых UI-решений. Паттерны компонентов, форм, таблиц на базе shadcn/ui. Все новые UI-решения фиксировать здесь.

**`CODE_LEARNINGS.md`**
Архив нетривиальных решений и выученных уроков.

**`MASTER_PLAN_V2.md`**
Пошаговый план разработки v2. Текущий статус по стадиям.

### 4.1 Конфигурация

| Файл | Назначение |
|---|---|
| `next.config.ts` | Next.js конфигурация |
| `tsconfig.json` | TypeScript (strict mode) |
| `tailwind.config.ts` | Tailwind CSS v4 + кастомные токены |
| `components.json` | shadcn/ui registry config |
| `playwright.config.ts` | Playwright E2E конфигурация |
| `.env.local` | Секреты (gitignored) |
| `.env.local.example` | Шаблон переменных окружения |
| `.github/workflows/ci.yml` | CI pipeline |

### 4.2 Библиотеки и утилиты

| Файл | Назначение |
|---|---|
| `src/lib/supabase/client.ts` | Browser Supabase клиент (anon key) |
| `src/lib/supabase/server.ts` | Server Supabase клиент (service_role) |
| `src/lib/supabase/middleware.ts` | Auth middleware (protect routes) |
| `src/lib/calculations.ts` | **КЛЮЧЕВОЙ.** Все формулы KPI (scale/binary/discrete/composite/reward) |
| `src/lib/constants.ts` | Константы приложения |
| `src/lib/utils.ts` | Утилиты (cn, formatters) |
| `src/lib/api-auth.ts` | Хелпер авторизации для API routes |

### 4.3 Провайдеры

| Файл | Назначение |
|---|---|
| `src/providers/query-provider.tsx` | TanStack Query client provider |

### 4.4 Типы

| Файл | Назначение |
|---|---|
| `src/types/database.ts` | Суперсет типов сгенерированных из Supabase schema |
| `src/types/kpi.ts` | ViewModel-типы (компоненты работают с этими, не с DB-строками) |

### 4.5 Модули (`src/features/`)

| Модуль | Компоненты | Хуки |
|---|---|---|
| `auth` | `auth-provider.tsx`, `header.tsx`, `logout-button.tsx`, `sidebar-nav.tsx` | — |
| `dashboard` | `admin-dashboard.tsx`, `approver-dashboard.tsx`, `participant-dashboard.tsx`, `cards-table.tsx`, `metric-card.tsx`, `execution-by-user-chart.tsx`, `status-distribution-chart.tsx`, `rewards-summary-table.tsx`, `status-badge.tsx`, `period-utils.ts` | — |
| `kpi-cards` | `add-line-modal.tsx`, `comment-modal.tsx`, `fact-input.tsx`, `kpi-card-audit.tsx`, `kpi-card-header.tsx`, `kpi-card-reward.tsx`, `kpi-line-row.tsx`, `l2-line-row.tsx`, `trigger-goal-block.tsx` | `use-kpi-cards.ts`, `use-card-mutations.ts` |
| `kpi-library` | `kpi-table.tsx`, `kpi-modal.tsx`, `kpi-filters.tsx`, `kpi-modal-schema.ts`, `kpi-properties-editor.tsx`, `kpi-period-picker.tsx`, `discrete-target-field.tsx`, `discrete-points-editor.tsx`, `scale-ranges-editor.tsx` | `use-kpi-library.ts` |
| `participants` | — | `use-participants.ts` |
| `trigger-goals` | — | `use-trigger-goals.ts` |
| `shared` | — | `use-audit-log.ts`, `use-dictionaries.ts`, `use-events.ts`, `query-keys.ts` |
| `approvals` | placeholder | — |
| `archive` | placeholder | — |
| `dictionaries` | placeholder | — |

### 4.6 UI-компоненты (`src/components/ui/`)

alert, badge, button, card, checkbox, dialog, dropdown-menu, form, input, label, popover, progress, scroll-area, select, separator, sheet, switch, table, tabs, textarea, toggle-group, toggle, tooltip

### 4.7 Тесты

| Путь | Назначение |
|---|---|
| `src/__tests__/calculations.test.ts` | Unit-тесты бизнес-формул |
| `src/__tests__/api-routes.test.ts` | Integration-тесты API routes |
| `src/__tests__/setup.ts` | Vitest setup |
| `src/__tests__/e2e/kpi-cards.spec.ts` | E2E: список и детальная страница KPI-карт |
| `src/__tests__/e2e/helpers/auth.helper.ts` | E2E: хелпер логина |
| `src/__tests__/e2e/helpers/seed.helper.ts` | E2E: хелперы навигации |
| `src/__tests__/e2e/helpers/constants.ts` | E2E: константы (URL, credentials) |

---

## 4.5 РОУТИНГ (App Router)

```
src/app/
  layout.tsx                          — root layout (QueryProvider, AuthProvider)
  page.tsx                            — root redirect (→ /kpi-cards или /login)
  design/page.tsx                     — дизайн-система (dev only)
  (auth)/
    login/page.tsx                    — страница входа
  (dashboard)/
    layout.tsx                        — dashboard shell (sidebar + auth guard)
    page.tsx                          — dashboard home (role-based redirect)
    kpi-cards/page.tsx                — список KPI-карт
    kpi-cards/[id]/page.tsx           — детальная страница KPI-карты
    library/page.tsx                  — библиотека KPI-показателей
    participants/page.tsx             — участники (placeholder)
    approvals/page.tsx                — согласование (placeholder)
    archive/page.tsx                  — архив (placeholder)
    events/page.tsx                   — события (placeholder)
    dictionaries/page.tsx             — справочники (placeholder)
    trigger-goals/page.tsx            — триггерные цели (placeholder)
    profile/page.tsx                  — профиль (placeholder)
  api/
    reward/calculate/route.ts         — расчёт вознаграждения
    cards/submit/route.ts             — подача карты на согласование
    cards/approve-line/route.ts       — согласование строки
    cards/return-line/route.ts        — возврат строки на доработку
```

---

## 5. РАБОЧИЕ ПРАВИЛА

1. **DB First** — сначала миграция в Supabase, потом код
2. **RLS Primary** — доступ через RLS, не только через app-код
3. **TypeScript strict** — no `any`, no `as`, явные типы
4. **ViewModel pattern** — компоненты не видят DB-строки напрямую
5. **Calculations only in `src/lib/calculations.ts`** — единственный источник бизнес-логики
6. **Immutability** — никаких мутаций, только новые объекты
7. **shadcn/ui first** — кастомные компоненты только когда shadcn не покрывает
8. **TanStack Query** — весь server state только через Query/Mutation
9. **Server Actions** — для мутаций (создание, обновление, удаление)
10. **Test-first для calculations.ts** — бизнес-логика покрывается тестами

---

## 6. BUILD & DEV КОМАНДЫ

```bash
npm run dev            # Запустить dev server (localhost:3000)
npm run build          # Production build
npm run lint           # ESLint
npm run typecheck      # TypeScript check (tsc --noEmit)
npm run test           # Vitest (watch mode)
npm run test:run       # Vitest (one-shot)
npm run test:coverage  # Vitest с coverage
npm run format         # Prettier (fix)
npm run format:check   # Prettier (check)
npm run test:e2e       # Playwright E2E tests
```

**E2E счётчик:** `merges_without_full_e2e: 0`

---

## 7. СТАТУС РАЗРАБОТКИ

| Стадия | Статус | Описание |
|---|---|---|
| Stage 0 | ✅ Выполнено | Инфраструктура, VKF (49 файлов), CLAUDE.md, living docs, ci.yml |
| Stage 1 | ✅ Выполнено | Next.js init, Supabase clients, layout, дизайн-система, placeholder routes |
| Stage 2 | ✅ Выполнено | DB schema (PostgreSQL + RLS), TypeScript типы, seed data |
| Stage 3 | ✅ Выполнено | Auth module, login page, AppLayout с role-based sidebar и routing |
| Stage 4 | ✅ Выполнено | Calculation engine (scale/binary/discrete/composite/reward), unit tests |
| Stage 5 | ✅ Выполнено | TanStack Query data layer по всем feature-модулям |
| Stage 6 | ✅ Выполнено | API routes, auth middleware, server-side reward calculation |
| Stage 7 | ✅ Выполнено | Role-based dashboards (admin/approver/participant) с charts и KPI summary tables |
| Stage 8 | ✅ Выполнено | KPI library с CRUD modal, filters, and table |
| Stage 9 | 🔲 В процессе | KPI Cards — list page, detail page, E2E тесты (Session 1 завершена) |
| Stage 10 | 🔲 Не начато | Согласование, участники, события, справочники |
| Stage 11 | 🔲 Не начато | Vercel deploy, production hardening, full E2E scope |

**Текущая стадия: Stage 9 — KPI Cards (Session 1 завершена, продолжение в следующей сессии)**

---

## 8. СЕССИОННЫЙ ЛОГ

| Дата | Что сделано |
|---|---|
| 2026-04-14 | Stage 0: VKF (49 файлов), CLAUDE.md, .gitignore, ci.yml, .env.local.example, ТЗ v2.0, PROJECT_CONTEXT.md, UI_PATTERNS.md, CODE_LEARNINGS.md |
| 2026-04-14 | Stage 1: Next.js init, Supabase clients (browser + server), root layout, login page, dashboard shell, placeholder routes, дизайн-система (Geologica + JetBrains Mono, dark theme) |
| 2026-04-14 | Stage 2: DB schema (PostgreSQL + RLS) — таблицы users, kpi_indicators, kpi_cards, kpi_lines, kpi_line_l2, audit_log, events, trigger_goals, dictionaries; seed data |
| 2026-04-14 | Stage 3: Auth context (AuthProvider), login page с Supabase signInWithPassword, AppLayout с role-based sidebar, routing через App Router |
| 2026-04-14 | Stage 4: Calculation engine в `src/lib/calculations.ts` — scale/binary/discrete/composite/reward формулы; Vitest unit tests |
| 2026-04-14 | Stage 5: TanStack Query data layer — хуки для kpi-cards, kpi-library, participants, trigger-goals, shared (dictionaries, events, audit-log) |
| 2026-04-14 | Stage 6: API routes (reward/calculate, cards/submit, cards/approve-line, cards/return-line), auth middleware для защиты routes, server-side reward calculation |
| 2026-04-14 | Stage 7: Role-based dashboards — admin (charts + cards table), approver, participant; компоненты: MetricCard, StatusDistributionChart, ExecutionByUserChart, RewardsSummaryTable |
| 2026-04-14 | Stage 8: KPI Library — таблица KPI с фильтрами, CRUD modal (create/edit/delete), DiscretePointsEditor, ScaleRangesEditor, KpiPeriodPicker |
| 2026-04-15 | Stage 9 Session 1: KPI Cards list page (фильтры по статусу/году), detail page (9 subcomponents: header, reward, kpi-line-row, l2-line-row, fact-input, add-line-modal, comment-modal, kpi-card-audit, trigger-goal-block); E2E тесты (playwright.config.ts + dotenv, kpi-cards.spec.ts — 5 passed / 2 skipped); fix TypeScript: @base-ui/react Select onValueChange (string\|null); fix DB: linked auth_id в таблице users для admin@kpi.local |
