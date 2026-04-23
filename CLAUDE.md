@AGENTS.md

## Работа с базой данных

### Соглашение об именовании

Файлы миграций ДОЛЖНЫ соответствовать шаблону: `<timestamp>_<name>.sql`
- Формат timestamp: `YYYYMMDDHHMMSS` (14 цифр)
- Пример: `20260419010000_participants_bulk_import.sql`
- `npx supabase migration new <name>` генерирует правильное имя автоматически
- Файлы с неправильным именем молча пропускаются CLI без ошибки

### Workflow создания миграций

1. Создать файл миграции: `npx supabase migration new <name>`
2. Написать SQL в созданном файле `supabase/migrations/YYYYMMDDHHMMSS_<name>.sql`
3. Проверить безопасность: `node scripts/migration-safety-analyzer.mjs`
4. Локальный push с dry-run: `npx supabase db push --dry-run`
5. После ревью: `npx supabase db push`

### Baseline и repair

Локальное отслеживание началось с PR #19 (2026-04-23).
Базовый файл: `supabase/migrations/20260101000000_baseline_schema.sql`

Если появляются remote-only миграции без локальных файлов (orphaned):
```
# Пометить как reverted (удалить из отслеживания, схема остаётся):
npx supabase migration repair --status reverted <timestamp>...

# Пометить локальную миграцию как уже применённую:
npx supabase migration repair --status applied <timestamp>
```

### Escape-hatch маркеры (добавлять в commit message или PR body)

| Маркер | Когда использовать |
|--------|-------------------|
| `[explicit-data-loss: reason]` | DROP TABLE, TRUNCATE, DELETE без WHERE — + создать backup в `supabase/backups/YYYY-MM-DD-HHMMSS.sql` |
| `[column-unused: reason]` | DROP COLUMN, DROP CONSTRAINT на неиспользуемых объектах |
| `[type-compatible: reason]` | ALTER COLUMN TYPE, SET NOT NULL, ADD UNIQUE |
| `[rls-reviewed: reason]` | ENABLE/DISABLE RLS, CREATE/DROP/ALTER POLICY |
| `[execute-reviewed: reason]` | EXECUTE с динамическим SQL (переменная, конкатенация, format()) в plpgsql |

### Запрещено (никогда без явного запроса пользователя)

- `npx supabase db reset` — удаляет всю локальную БД
- `npx supabase db execute` — выполняет произвольный SQL в обход миграций
- `psql` — прямое подключение к БД

## Ограничения CCVS (fail-safes)

- Правка `.github/workflows/*` — запрещена через `settings.local.json`. Нужна? Делает пользователь вручную в VS Code.
- `supabase db reset`, `db execute`, прямой `psql` — запрещены deny-списком.
- `db push` — требует явного разрешения пользователя на каждую сессию.
- `DROP TABLE`, `TRUNCATE`, `DELETE` без `WHERE` — блокируются `migration-safety-analyzer.mjs` (L1, hard block).
- `EXECUTE` с динамическим SQL в plpgsql — блокируется (L2, разблокируется маркером `[execute-reviewed]`).
- Если `migration-safety-analyzer.mjs` недоступен или упал с ошибкой — `vkf-compliance-gate.mjs` блокирует merge (fail-closed).

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
