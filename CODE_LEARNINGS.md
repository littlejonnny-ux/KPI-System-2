# CODE_LEARNINGS.md
> Архив нетривиальных решений и выученных уроков. Фиксируй сюда всё что не очевидно из кода.

---

## Base UI — DropdownMenuTrigger не поддерживает `asChild`

**Проект использует `@base-ui/react`**, а не Radix UI. `MenuPrimitive.Trigger.Props` не имеет свойства `asChild`.

- **Неверно:** `<DropdownMenuTrigger asChild><Button>...</Button></DropdownMenuTrigger>`
- **Верно:** стилизовать `DropdownMenuTrigger` напрямую через `className`:
  ```tsx
  <DropdownMenuTrigger
    className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
  >
    <MoreHorizontal className="h-4 w-4" />
  </DropdownMenuTrigger>
  ```

## RHF + Zod 4 — избегай `.pipe()` с числовыми трансформациями

При использовании `z.string().pipe(z.coerce.number())` в полях формы возникает конфликт типов в RHF `Control<TFieldValues>` — поле ожидает `string` от input, но resolver выдаёт `number`. Это вызывает TS2345 «Argument of type X is not assignable to parameter of type Y».

- **Неверно:** `baseSalary: z.string().pipe(z.coerce.number().nullable().optional())`
- **Верно:** оставить поле как `z.string().optional()`, а `parseFloat()` вызывать в submit handler:
  ```typescript
  const parsedSalary = values.baseSalary ? parseFloat(values.baseSalary) : null;
  ```

## Supabase Auth Admin — double-client pattern

`supabase.auth.admin.*` методы (`createUser`, `updateUserById`, `deleteUser`) требуют клиент с **service_role key**. SSR клиент (`@supabase/ssr`) работает с JWT сессии — для auth.admin операций он не подходит.

Паттерн в API routes:
```typescript
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

const adminClient = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);
// Для проверки сессии запроса — использовать отдельный SSR клиент
```

## Compensating transaction при создании участника

Порядок: сначала Supabase Auth user, потом users table insert. Если insert падает — нужно откатить auth user:
```typescript
const { data: authData } = await adminClient.auth.admin.createUser({ ... });
// ... если insert в users упал:
await adminClient.auth.admin.deleteUser(authData.user.id);
```

## import_participants_bulk — SECURITY DEFINER RPC

Для bulk insert участников используется PostgreSQL функция с `SECURITY DEFINER` — выполняется от имени владельца функции (обходит RLS). Возвращает `{created, skipped, errors}`. При ошибке одной строки — продолжает остальные (per-row exception handling через `BEGIN ... EXCEPTION WHEN OTHERS THEN ... END`).

## Генерация безопасного пароля без внешних зависимостей

`crypto.getRandomValues()` доступен в браузере и Node.js 19+. В Next.js API routes работает из коробки:
```typescript
const array = new Uint8Array(length);
crypto.getRandomValues(array);
return Array.from(array, (byte) => CHARSET[byte % CHARSET.length]).join("");
```
Charset исключает визуально похожие символы: `0/O`, `1/l/I` и т.д.

## Playwright: networkidle зависает с Supabase Realtime

`waitForLoadState('networkidle')` никогда не выполняется в CI, если страница использует Supabase Realtime — WebSocket держит соединение "активным" indefinitely. Использовать `'load'` вместо `'networkidle'` для `page.goto()` и всех `waitForLoadState`. Проявляется только в CI (в headed dev-режиме timeout не достигается, потому что тест завершается раньше).

- **Неверно:** `await page.waitForLoadState('networkidle')`
- **Верно:** `await page.waitForLoadState('load')`

## pg_dump baseline через Session Pooler (без Docker Desktop)

Стандартная команда `npx supabase db dump` требует Docker Desktop. Альтернатива — прямой `pg_dump` через Session Pooler (IPv4-совместимый):

```bash
pg_dump "postgresql://postgres.<project-ref>:<password>@aws-0-eu-west-1.pooler.supabase.com:5432/postgres" \
  --schema=public \
  --schema-only \
  --no-owner \
  --no-privileges \
  -f supabase/migrations/20260101000000_baseline_schema.sql
```

**Важно:** Session Pooler добавляет нестандартные маркеры `\restrict <token>` в начало и `\unrestrict <token>` в конец файла. Это не SQL и не pg_dump директивы — это артефакт пулера. Их нужно удалить перед коммитом, иначе `supabase db push` завершится с ошибкой.

**Escape-hatch маркеры** для коммита с pg_dump baseline:
- `[execute-reviewed: ...]` — EXECUTE внутри CREATE FUNCTION тел — это DDL от pg_dump, не пользовательский код
- `[type-compatible: ...]` — ADD UNIQUE constraints отражают существующую схему, дубликатов нет
- `[rls-reviewed: ...]` — RLS политики — снимок существующей production конфигурации

**`[skip-vkf-gate]` — точный токен без двоеточия.** Скрипт проверяет `allCommitMsgs.includes('[skip-vkf-gate]')` — с закрывающей скобкой. `[skip-vkf-gate: reason]` не совпадает (двоеточие идёт до закрывающей скобки).

## Migration-safety-analyzer: валидация имени файла как Layer 2

`migration-safety-analyzer.mjs` проверяет имя файла миграции **до** анализа содержимого. Regex: `^\d{14}_[a-z][a-z0-9_]*\.sql$`. Файлы с дефисами, коротким timestamp или заглавными буквами блокируются сразу с BLOCK.

**Паттерн для smoke-тестов:** физические fixture-файлы в `__tests__/` имеют нестандартные имена (`01-drop-table.sql` и т.д.) — они пропускают проверку имени. Для тестирования самой валидации используется флаг `--filename <override>`, который подставляет симулируемое имя без переименования файла.

```js
// В smoke-test-analyzer.mjs:
{ file: 'invalid-name-with-hyphens.sql', expected: 'BLOCK', nameOverride: '2026-04-19-01-test.sql' }
// Runner добавляет: --filename '2026-04-19-01-test.sql'
```

`path.basename(filePath)` — стандартный способ извлечь имя файла из пути для regex-проверки.

## Migration-safety-analyzer: маркеры читаются из PR body в CI, а не только из commit message

В GitHub Actions `git log -1 --pretty=%B` возвращает synthetic merge commit (не commit PR-ветки). Поэтому маркеры из commit message PR могут не находиться. `migration-safety-analyzer.mjs` комбинирует оба источника: `getCommitMarkers()` + `getPrBodyMarkers()` (читает `GITHUB_EVENT_PATH`). Для надёжности — дублируй escape-hatch маркеры в PR body, не только в commit message.
