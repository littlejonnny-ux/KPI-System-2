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
