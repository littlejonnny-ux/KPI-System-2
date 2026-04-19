# Learned Overrides

> Этот файл заполняется автоматически по результатам post-merge retrospective.
> Claude Code читает его перед принятием решения об активации skills/agents.
> Маркеры из этого файла ПЕРЕОПРЕДЕЛЯЮТ правила из TRIGGER_MAP.md.

---

## Маркеры

### 2026-04-16 PR #1 — chore: sync VKF after E2E architecture rework
- **Diff:** +349 / -121 строк, 12 файлов (все в `.claude/`)
- **Тип:** chore (VKF framework config)
- **Активировано:** code-reviewer по правилу ">3 файлов"
- **Результативно:** ничего — это конфиг фреймворка, не исходный код проекта
- **Избыточно:** code-reviewer, security-reviewer, database-reviewer
- **Маркер:** Изменения исключительно в `.claude/` → пропускать code-reviewer, security-reviewer, database-reviewer, e2e-testing. Подтверждено на Stage 0 (aee4e73) и PR #1 (471f330).

---

### 2026-04-16 PR #2 + PR #3 — docs-only обновления (MASTER_PLAN, PROJECT_CONTEXT)
- **Diff:** PR #2: +32 / -10, 1 файл (.md); PR #3: +110 / -49, 1 файл (.md)
- **Тип:** docs
- **Активировано:** ничего (TRIGGER_MAP уже исключает docs-only)
- **Результативно:** правило корректно
- **Избыточно:** —
- **Маркер:** Docs-only PRs (.md файлы) → пропускать все review-агенты. Подтверждено на 2 реальных PR.

---

### 2026-04-14 Stage 4 — calculation engine + unit tests (dde76db)
- **Diff:** +973 / -49 строк, 4 файла (calculations.ts, constants.ts, tests, MASTER_PLAN)
- **Тип:** code (pure business logic, no UI, no auth, no API routes)
- **Активировано:** code-reviewer (>3 файлов), потенциально security-reviewer
- **Результативно:** code-reviewer полезен для проверки алгоритмов; security-reviewer — 0 issues (нет attack surface в математических функциях)
- **Избыточно:** security-reviewer, e2e-testing
- **Маркер:** Изменения только в calculations.ts / constants.ts + unit-тесты (TDD) → пропускать security-reviewer (нет auth/input/API) и e2e-testing (покрыто unit-тестами). Подтверждено на Stage 4.

---

### 2026-04-15 Stage 5 — TanStack Query data layer, hooks only (bcb9c55)
- **Diff:** большой, все изменения в `src/features/*/hooks/`
- **Тип:** code (data layer только, без новых UI-страниц)
- **Активировано:** code-reviewer, потенциально e2e-testing и security-reviewer
- **Результативно:** code-reviewer полезен; security-reviewer — минимальная ценность (client-side хуки защищены RLS на уровне БД, не на уровне хука); e2e-testing — избыточен
- **Избыточно:** e2e-testing, security-reviewer
- **Маркер:** Изменения только в `hooks/` без новых страниц/UI-компонентов → пропускать e2e-testing и security-reviewer. RLS auto-filtering через Supabase JWT достаточен; уязвимости в TanStack Query wrappers без API routes маловероятны.

---

### 2026-04-14 Stage 2 — DB schema + RLS + migrations (f90e366)
- **Diff:** +1720 / -35 строк, 12 файлов (9 миграций, rollbacks, types)
- **Тип:** code (database migrations + RLS policies)
- **Активировано:** database-reviewer, security-reviewer
- **Результативно:** ОБА критически полезны — 18 таблиц, RLS на всех таблицах, PostgreSQL functions
- **Избыточно:** ничего
- **Маркер:** Supabase миграции с RLS-политиками → ОБЯЗАТЕЛЬНО запускать database-reviewer И security-reviewer. Оба приносят ценность: database-reviewer проверяет схему/индексы, security-reviewer проверяет дыры в RLS. Подтверждено на Stage 2 (9 миграций, 18 таблиц).

---

### 2026-04-14 Stage 3 — auth context, login page, AppLayout с role-based routing (687b341)
- **Diff:** +большой, 10+ файлов (proxy.ts, auth-provider, sidebar-nav, login page, dashboard layout)
- **Тип:** code (auth flow + server-side route guards + UI)
- **Активировано:** code-reviewer (>3 файлов), security-reviewer (auth code)
- **Результативно:** ОБА полезны — code-reviewer для архитектуры AuthProvider + layout, security-reviewer для session management и route guard logic
- **Избыточно:** e2e-testing на этапе создания скелета (login есть, но остальные страницы — заглушки; полноценные E2E имеют смысл когда есть реальный user journey)
- **Маркер:** Новый auth flow (AuthProvider, proxy.ts, ROUTE_PERMISSIONS) → запускать security-reviewer и code-reviewer. e2e-testing — только если помимо login есть хотя бы один полноценный рабочий маршрут.

---

### 2026-04-15 Stage 6 — API routes с role-based access + сервер-сайд расчёты (fd4556a)
- **Diff:** +большой, API routes (approve-line, return-line, submit, reward/calculate) + api-auth.ts + 96 тестов
- **Тип:** code (API routes, auth, бизнес-логика)
- **Активировано:** code-reviewer, security-reviewer (API routes + user input), database-reviewer (RPC calls)
- **Результативно:** security-reviewer КРИТИЧЕН — role-based access control, status machine, user input в route handlers; code-reviewer полезен для архитектуры; database-reviewer — для atomic RPC
- **Избыточно:** e2e-testing (API routes полностью покрыты 96 unit-тестами; E2E избыточен при таком coverage)
- **Маркер:** Новые API routes с role-based access control → ОБЯЗАТЕЛЬНО security-reviewer + code-reviewer. Если unit-тесты покрывают 80%+ route handlers — e2e-testing можно пропустить. Подтверждено на Stage 6.

---

### 2026-04-15 Stage 7 — role-based dashboards, charts, read-only UI (86900f3)
- **Diff:** +~900 строк, 11 UI-компонентов (MetricCard, recharts BarChart/PieChart, таблицы)
- **Тип:** code (pure read-only UI, нет мутаций, нет форм с user input)
- **Активировано:** code-reviewer (>3 файлов), e2e-testing (новые UI страницы), security-reviewer
- **Результативно:** code-reviewer полезен; e2e-testing ценен (роль-роутинг через useAuth, 3 разных dashboard)
- **Избыточно:** security-reviewer (read-only данные через TanStack Query + RLS, нет форм, нет мутаций, нет user input)
- **Маркер:** Новые dashboard UI-компоненты (только read-only display, без форм и мутаций) → code-reviewer + e2e-testing, пропускать security-reviewer. Подтверждено на Stage 7.

---

### 2026-04-15 Stage 8 — KPI library CRUD modal с complex forms (51c1de9)
- **Diff:** +большой, 15+ файлов (kpi-modal, kpi-table, filters, useFieldArray editors, shadcn UI)
- **Тип:** code (CRUD UI, complex forms с мутациями)
- **Активировано:** code-reviewer, e2e-testing (новая CRUD страница), security-reviewer
- **Результативно:** code-reviewer КРИТИЧЕН (423-строчный modal, useFieldArray, auto-linkage, duplicate detection); e2e-testing критичен (CRUD flow — ключевая механика); security-reviewer полезен (user input в формах → мутации в БД через hooks)
- **Избыточно:** ничего
- **Маркер:** CRUD modal с complex forms (useFieldArray, мутации в БД) → запускать ВСЕ THREE: code-reviewer + e2e-testing + security-reviewer. Форма с мутациями = attack surface. Подтверждено на Stage 8.

---

### 2026-04-19 PR #15 — Participants CRUD + Excel import + password flow (5cf59e8)
- **Diff:** +2022 / -32 строк, 23 файла (4 API routes, 4 UI components, page, hooks, utils, E2E spec, migration, CI/ESLint)
- **Тип:** mixed (code + docs + config)
- **Активировано:** code-reviewer, security-reviewer, e2e-testing (написан participants.spec.ts)
- **Результативно:** code-reviewer КРИТИЧЕН — нашёл баг: `newPassword` отсутствовал в интерфейсе `ResetPasswordInput` и не сериализовался в тело запроса (API получал undefined); security-reviewer ПОЛЕЗЕН — нашёл unsafe type assertion `as Parameters<typeof resetPasswordMutation.mutate>[0]`; e2e-testing необходим (новая CRUD-страница с import-механикой)
- **Избыточно:** database-reviewer НЕ был активирован — и это ошибка (migration содержала сложную PostgreSQL-функцию `import_participants_bulk` с compensating transaction и SECURITY DEFINER)
- **Маркер:** Новые API routes с `supabase.auth.admin.*` (createUser/deleteUser) + bulk import RPC + UI формы → запускать ВСЕ ЧЕТЫРЕ: code-reviewer + security-reviewer + e2e-testing + database-reviewer. database-reviewer обязателен при любой migration с PostgreSQL-функцией SECURITY DEFINER или compensating transaction. Подтверждено на Stage 10 Session 1.
