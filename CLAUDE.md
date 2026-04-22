@AGENTS.md

## Работа с базой данных

### Workflow создания миграций

1. Создать файл миграции: `npx supabase migration new <name>`
2. Написать SQL в созданном файле `supabase/migrations/YYYYMMDDHHMMSS_<name>.sql`
3. Проверить безопасность: `node scripts/migration-safety-analyzer.mjs`
4. Локальный push с dry-run: `npx supabase db push --dry-run`
5. После ревью: `npx supabase db push`

### Escape-hatch маркеры (добавлять в commit message или PR body)

| Маркер | Когда использовать |
|--------|-------------------|
| `[explicit-data-loss: reason]` | DROP TABLE, TRUNCATE, DELETE без WHERE — + создать backup в `supabase/backups/YYYY-MM-DD-HHMMSS.sql` |
| `[column-unused: reason]` | DROP COLUMN, DROP CONSTRAINT на неиспользуемых объектах |
| `[type-compatible: reason]` | ALTER COLUMN TYPE, SET NOT NULL, ADD UNIQUE |
| `[rls-reviewed: reason]` | ENABLE/DISABLE RLS, CREATE/DROP/ALTER POLICY |

### Запрещено (никогда без явного запроса пользователя)

- `npx supabase db reset` — удаляет всю локальную БД
- `npx supabase db execute` — выполняет произвольный SQL в обход миграций
- `psql` — прямое подключение к БД

## После compaction

После каждого compaction (autocompact или ручного /compact) — ОБЯЗАТЕЛЬНО перечитай:
1. `.claude/workflow/CYCLE.md` — полный цикл задачи, post-merge шаги, Living Docs Dashboard
2. `.claude/workflow/TRIGGER_MAP.md` — все триггеры активации skills/agents/commands
3. `.claude/workflow/LEARNED_OVERRIDES.md` — маркеры, переопределяющие триггеры
4. `.claude/workflow/LEARNED_PATTERNS.md` — технические паттерны, дополняющие реализацию
5. `.claude/skills/e2e-testing/SKILL.md` — трёхуровневая схема E2E, счётчик, шаблоны
6. `.claude/workflow/RETROSPECTIVE.md` — 5 шагов ретроспективы

Эти документы содержат критические развилки процесса и накопленные маркеры обучения,
которые теряются при сжатии контекста. Без перечитывания LEARNED_OVERRIDES — риск
избыточной активации агентов вопреки накопленным правилам. Без перечитывания других —
высокий риск пропуска post-merge шагов (update-docs, ретроспектива, E2E).
