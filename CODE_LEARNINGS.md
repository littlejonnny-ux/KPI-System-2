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
