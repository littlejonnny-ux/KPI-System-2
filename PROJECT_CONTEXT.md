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
| Tests | Vitest + Testing Library |
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

**`MASTER_PLAN_V2.md`** _(когда появится)_
Пошаговый план миграции v1 → v2. Текущий статус по стадиям.

### 4.1 Конфигурация

| Файл | Назначение |
|---|---|
| `next.config.ts` | Next.js конфигурация |
| `tsconfig.json` | TypeScript (strict mode) |
| `tailwind.config.ts` | Tailwind CSS v4 + кастомные токены |
| `components.json` | shadcn/ui registry config |
| `.env.local` | Секреты (gitignored) |
| `.env.local.example` | Шаблон переменных окружения |

### 4.2 Библиотеки и утилиты

| Файл | Назначение |
|---|---|
| `src/lib/supabase/client.ts` | Browser Supabase клиент (anon key) |
| `src/lib/supabase/server.ts` | Server Supabase клиент (service_role) |
| `src/lib/calculations.ts` | **КЛЮЧЕВОЙ.** Все формулы KPI (scale/binary/discrete/composite/reward) |
| `src/lib/utils.ts` | Утилиты (cn, formatters) |

### 4.3 Модули (`src/features/`)

| Модуль | Назначение |
|---|---|
| `auth` | Аутентификация, сессия, AuthProvider |
| `dashboard` | Admin-дашборд, сводные метрики |
| `kpi-cards` | KPI-карты (список, детали, согласование) |
| `kpi-library` | Библиотека KPI-показателей |
| `participants` | Управление участниками |
| `approvers` | Согласующие |
| `levels` | Уровни сотрудников |
| `periods` | Управление периодами |
| `references` | Справочники (единицы измерения, категории) |
| `templates` | Шаблоны карт |
| `archive` | Архив закрытых карт |
| `reporting` | Отчёты и аналитика |

### 4.4 Типы и маппинг

| Файл | Назначение |
|---|---|
| `src/types/` | ViewModel-типы (компоненты работают с этими, не с DB-строками) |
| `src/features/*/mappers.ts` | Функции преобразования DB row → ViewModel |

### 4.5 Роутинг (App Router)

```
app/
  (auth)/login/page.tsx          — страница входа
  (app)/layout.tsx               — shell с sidebar
  (app)/dashboard/page.tsx
  (app)/kpi-cards/page.tsx
  (app)/kpi-cards/[id]/page.tsx
  (app)/participants/page.tsx
  ... и т.д. по модулям
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
npm run dev        # Запустить dev server (localhost:3000)
npm run build      # Production build
npm run lint       # ESLint
npm run test       # Vitest (watch mode)
npm run test:run   # Vitest (one-shot)
npx tsc --noEmit   # TypeScript check
```

---

## 7. СТАТУС РАЗРАБОТКИ

| Стадия | Статус | Описание |
|---|---|---|
| Stage 0 | ✅ Выполнено | Инфраструктура, VKF, CLAUDE.md, living docs |
| Stage 1 | 🔲 Не начато | Next.js init, Supabase clients, layout |
| Stage 2 | 🔲 Не начато | DB schema migration |
| Stage 3 | 🔲 Не начато | Auth module |
| Stage 4 | 🔲 Не начато | KPI Library module |
| Stage 5 | 🔲 Не начато | KPI Cards module |
| Stage 6 | 🔲 Не начато | Participants, Approvers, Levels |
| Stage 7 | 🔲 Не начато | Periods, References, Templates |
| Stage 8 | 🔲 Не начато | Dashboard, Archive, Reporting |
| Stage 9 | 🔲 Не начато | Vercel deploy, production hardening |

**Текущая стадия: Stage 0 — ожидание Supabase credentials и MASTER_PLAN_V2.md**

---

## 8. СЕССИОННЫЙ ЛОГ

| Дата | Что сделано |
|---|---|
| 2026-04-14 | Stage 0: VKF (49 файлов), CLAUDE.md, .gitignore, ci.yml, .env.local.example, TZ v2.0, PROJECT_CONTEXT.md, UI_PATTERNS.md, CODE_LEARNINGS.md |
