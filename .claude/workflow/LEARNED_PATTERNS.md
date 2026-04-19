# Learned Patterns

> Этот файл заполняется автоматически после каждого merge (шаг 5 ретроспективы).
> Claude Code извлекает нетривиальные технические паттерны, обнаруженные в ходе сессии,
> и записывает их сюда для повторного использования в будущих сессиях.
>
> Claude Code читает этот файл при получении задачи (после TRIGGER_MAP, вместе с LEARNED_OVERRIDES).
> Если текущая задача затрагивает область, для которой есть паттерн — применяет его.

---

## Паттерны

### 2026-04-14 Next.js 16: middleware.ts переименован в proxy.ts
- **Область:** Next.js 16 (breaking change)
- **Паттерн:** Файл `middleware.ts` → `proxy.ts`; экспортируемая функция — `export async function proxy(...)`, не `export default function middleware(...)`
- **Почему нетривиально:** Все туториалы и официальная документация до 2026 используют `middleware.ts`. Next.js 16 сломал это соглашение. При создании нового проекта на Next.js 16 — создавать `src/proxy.ts`, иначе middleware не применится.
- **Пример:**
  ```ts
  // src/proxy.ts — Next.js 16
  export async function proxy(request: NextRequest) {
    return updateSession(request);
  }
  export const config = { matcher: ["/((?!_next/static|...).*)" ] };
  ```

---

### 2026-04-15 Supabase API routes: двойной клиент (anon verify + service_role fetch)
- **Область:** Supabase SSR + Next.js App Router API routes
- **Паттерн:** В API route нужны ДВА клиента: anon-key client для верификации JWT из cookies, service_role client для получения профиля пользователя в обход RLS.
- **Почему нетривиально:** Один клиент не справляется с обоими: anon-client не может читать чужой профиль (RLS блокирует); service_role-client не имеет доступа к куки сессии. Комбинация — единственный рабочий паттерн.
- **Пример:**
  ```ts
  // src/lib/api-auth.ts
  // Шаг 1: verify JWT через anon-client (читает cookies)
  const anonClient = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, { cookies });
  const { data: { user } } = await anonClient.auth.getUser();
  // Шаг 2: fetch profile через service_role (обходит RLS)
  const serviceClient = createClient(); // service_role
  const { data: profile } = await serviceClient.from("users").select("*").eq("auth_id", user.id).single();
  ```

---

### 2026-04-14 Supabase: GENERATED ALWAYS колонки в TypeScript типах
- **Область:** Supabase + TypeScript codegen
- **Паттерн:** Колонки `GENERATED ALWAYS AS IDENTITY` (или computed) в автогенерированных типах Supabase появляются только в `Row`, не в `Insert`/`Update`. При создании ViewModel-типов их нужно явно исключать из мутирующих форм.
- **Почему нетривиально:** TypeScript компилятор не подскажет — тип совместим. Ошибка появится только в runtime при попытке вставить значение в GENERATED ALWAYS колонку.
- **Пример:** В `database.ts` (Stage 2): `Insert` типы не содержат GENERATED колонки, `Row` — содержат. Используй `Tables<'kpi_cards'>['Insert']` для мутаций, не `Tables<'kpi_cards'>['Row']`.

---

### 2026-04-14 Calculations engine: изоляция всей бизнес-логики в одном модуле
- **Область:** Архитектурный паттерн (KPI / финансовые расчёты)
- **Паттерн:** Все функции расчёта живут в `src/lib/calculations.ts`. Нет расчётов в компонентах, хуках или API routes. Функции принимают минимальные интерфейсы (`LineForExecution`, `CardLineForTotal`), возвращают новые значения (иммутабельно). 48 unit-тестов покрывают все evaluation methods.
- **Почему нетривиально:** Удобно класть логику рядом с компонентом, но при этом теряется возможность unit-тестировать её изолированно и переиспользовать в API routes. Единый модуль = один источник истины + полное покрытие тестами без моков UI.
- **Пример:** `getLineExecution(line)` → обрабатывает scale/binary/discrete/manual; `calcCardTotal(lines)` → использует `executionPct` из БД (не пересчитывает client-side). Оба тестируются в `calculations.test.ts` без React.

---

### 2026-04-14 Zod v4 + @hookform/resolvers: совместимость без изменений
- **Область:** Zod v4 + react-hook-form v7
- **Паттерн:** Zod v4 (`zod@^4.x`) — major rewrite, но `import { z } from "zod"` и базовый API (`z.object`, `z.string().email()`, `z.infer<>`) остались совместимы. `zodResolver` из `@hookform/resolvers@^5.x` работает с Zod v4 без изменений.
- **Почему нетривиально:** Большинство migration guides пугают breaking changes. В реальности для стандартных форм (string, email, min, required) переход с Zod v3 → v4 требует только обновления пакета. Формат ошибок изменился, но `formState.errors` через zodResolver абстрагирует это.
- **Пример:** `loginSchema` в `login/page.tsx` — чистый Zod v4, без изменений синтаксиса vs v3.

---

### 2026-04-14 Next.js App Router: server-side role guard через headers() + ROUTE_PERMISSIONS
- **Область:** Next.js 16 App Router + Supabase SSR
- **Паттерн:** Серверный layout.tsx читает `x-pathname` из `headers()` (установлен proxy.ts), сверяет с `ROUTE_PERMISSIONS: Record<string, SystemRole[]>`, делает `redirect('/dashboard')` при нарушении. Логика: перебор prefix-ключей + `pathname.startsWith(prefix + '/')`.
- **Почему нетривиально:** В App Router нельзя делать redirect в middleware после проверки session (middleware не имеет доступа к Supabase session cookie при edge runtime). Layout.tsx — правильное место для role guard, потому что здесь уже есть `getUser()` и profil, а не только cookie.
- **Пример:**
  ```ts
  // src/app/(dashboard)/layout.tsx
  const pathname = (await headers()).get("x-pathname") ?? "/";
  if (!isAllowed(pathname, profile.system_role)) redirect("/dashboard");
  ```

---

### 2026-04-15 Recharts в Next.js: компонент должен быть "use client"
- **Область:** Recharts + Next.js App Router
- **Паттерн:** Recharts (`BarChart`, `PieChart`, `ResponsiveContainer`) использует `window`/`document` при импорте — они не SSR-совместимы. Компонент с recharts обязан иметь `"use client"` директиву, иначе сборка падает с `ReferenceError: window is not defined`.
- **Почему нетривиально:** Recharts документация не упоминает это явно, а Next.js не всегда даёт понятную ошибку (иногда падает при `next build`, не при `next dev`).
- **Пример:** `execution-by-user-chart.tsx` и `status-distribution-chart.tsx` — оба начинаются с `"use client"`. Данные передаются как props из серверного родителя.

---

### 2026-04-15 RHF useFieldArray для матричных редакторов (scale ranges / discrete points)
- **Область:** react-hook-form v7 + бизнес-логика KPI
- **Паттерн:** `useFieldArray` для динамических строк (scale ranges, discrete points). Смежные диапазоны должны быть непрерывными (max предыдущего = min следующего) — это поддерживается утилитой `calcRangeBoundsInUnits`, вызываемой при `onChange` каждой строки, а не через Zod refinement (Zod не умеет cross-field array validation удобно).
- **Почему нетривиально:** Попытка сделать contiguous-validation через Zod `superRefine` на массиве приводит к сложным ошибкам и плохому UX (ошибки на уровне всего поля). Вычислять bounds в `onChange` — правильный подход: данные всегда консистентны, без лишних validation errors.
- **Пример:** `scale-ranges-editor.tsx` — `useFieldArray({ name: "scaleRanges" })`, при изменении строки i вызывает `calcRangeBoundsInUnits(fields, i)` и обновляет min/max соседних строк через `setValue`.

---

### 2026-04-19 Supabase bulk import: двухфазный Auth Admin + compensating transaction
- **Область:** Supabase Auth Admin API + PostgreSQL RPC + Next.js API routes
- **Паттерн:** Bulk import в два этапа: (1) создать auth users по одному через `auth.admin.createUser()` — не атомарно, per-row errors; (2) вставить все успешно созданных через `supabase.rpc('import_participants_bulk', { p_data })` — атомарно. Если RPC упал → compensating delete: `Promise.allSettled(authResults.map(({ authId }) => adminClient.auth.admin.deleteUser(authId)))`.
- **Почему нетривиально:** Auth users и DB users — две разные системы. RPC не может откатить auth users при сбое (они вне транзакции Postgres). Нужен явный compensating transaction в TypeScript. `Promise.allSettled` (не `Promise.all`) обязателен — чтобы частичный сбой удаления не прерывал весь rollback.
- **Пример:**
  ```ts
  // Phase 1: non-atomic auth creation
  for (const p of participants) {
    const { data, error } = await adminClient.auth.admin.createUser({ email: p.workEmail, ... });
    if (error) rowErrors.push(...); else authResults.push({ authId: data.user.id, ... });
  }
  // Phase 2: atomic DB insert
  const { error: rpcError } = await supabase.rpc('import_participants_bulk', { p_data: rpcData });
  if (rpcError) {
    await Promise.allSettled(authResults.map(({ authId }) => adminClient.auth.admin.deleteUser(authId)));
  }
  ```

---

### 2026-04-19 crypto.getRandomValues() для безопасной генерации паролей
- **Область:** Web Crypto API + Node.js 19+
- **Паттерн:** `crypto.getRandomValues(new Uint8Array(n))` вместо `Math.random()` для генерации временных паролей. `crypto` — глобальный объект в браузере и Node.js 19+, не требует импорта. Символы выбираются через `index % charset.length` — без bias (при длине charset ≤ 64).
- **Почему нетривиально:** `Math.random()` — не криптографически стойкий. `crypto.randomBytes()` из Node.js `crypto` модуля работает только на сервере. `crypto.getRandomValues()` — единственный вариант, работающий и в browser-среде (`generate-password.ts` вызывается и из UI, и из API route без изменений).
- **Пример:**
  ```ts
  export function generateTempPassword(length = 16): string {
    const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
    const bytes = crypto.getRandomValues(new Uint8Array(length));
    return Array.from(bytes, b => charset[b % charset.length]).join('');
  }
  ```

---

### 2026-04-19 Dynamic import для опциональных тяжёлых библиотек
- **Область:** Next.js App Router + webpack bundling
- **Паттерн:** `await import("xlsx")` внутри обработчика события (не на верхнем уровне модуля) — библиотека загружается только когда пользователь выбрал файл, не попадает в initial bundle.
- **Почему нетривиально:** `xlsx` весит ~500 KB minified. Статический `import XLSX from "xlsx"` включает его в основной чанк. Динамический import создаёт отдельный чанк, который грузится лениво. Применимо к любой библиотеке, нужной только для специфического user action (PDF, docx, etc.).
- **Пример:**
  ```ts
  async function parseFile(file: File) {
    const XLSX = await import("xlsx"); // загружается только здесь
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  }
  ```

---

### 2026-04-19 ESM в Node.js скриптах без "type":"module": расширение .mjs
- **Область:** Node.js ESM / CommonJS + ESLint `no-require-imports`
- **Паттерн:** Если `package.json` не содержит `"type": "module"`, `.js` файлы трактуются Node.js как CommonJS. Для ESM-синтаксиса (`import`/`export`) нужно расширение `.mjs`. Добавить `__dirname` полифил: `const __filename = fileURLToPath(import.meta.url); const __dirname = path.dirname(__filename);`.
- **Почему нетривиально:** ESLint с `@typescript-eslint/no-require-imports` блокирует `require()` в `.js`, но сам Node.js не поддержит ESM-синтаксис в `.js` без `"type":"module"`. Переименование в `.mjs` — единственный путь без изменения `package.json` (что может сломать другие части проекта).
- **Пример:**
  ```js
  // scripts/tool.mjs
  import { spawnSync } from 'node:child_process';
  import { fileURLToPath } from 'node:url';
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  ```

---

### 2026-04-15 Supabase RPC для атомарных операций (approve_card_line)
- **Область:** Supabase + PostgreSQL RPC
- **Паттерн:** Бизнес-операции, требующие нескольких UPDATE в одной транзакции (например, approve line + recalculate card total + update card status), вынесены в PostgreSQL function и вызываются через `.rpc('approve_card_line', { params })`. Один round-trip, атомарность гарантирована на уровне БД.
- **Почему нетривиально:** Альтернатива — несколько последовательных `.update()` из API route — не атомарна: при сбое на втором запросе данные окажутся в inconsistent state. RPC избегает этого без необходимости писать транзакционную логику на TypeScript.
- **Пример:** `src/app/api/cards/approve-line/route.ts` — `supabase.rpc('approve_card_line', { line_id, approved_by })`. Функция в БД делает UPDATE kpi_card_lines + UPDATE kpi_cards в одной транзакции.
