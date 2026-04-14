# MASTER PLAN: KPI-System v2.0
## Полная перестройка в целевом стеке
### Версия 2.1 — гармонизирована с Vibe-Coding Framework (после аудита апрель 2026)

---

## Мета-информация

**Цель:** Создать KPI-System с нуля в целевом стеке, воспроизводя 100% функциональности текущей системы.

**Тир проекта:** STANDARD — production-приложение, ~200 пользователей, финансовые расчёты, PII-данные, срок жизни — годы.

**Целевой стек:**

| Компонент | Технология |
|---|---|
| Frontend | Next.js 15 (App Router) + TypeScript strict |
| Стили | Tailwind CSS + shadcn/ui (dark mode) |
| Backend / БД | Supabase (PostgreSQL + Auth + RLS enforced) — новый проект |
| Server state | TanStack Query v5 |
| Формы | React Hook Form + Zod |
| Тестирование | Vitest + Testing Library |
| Хостинг | Vercel (auto-deploy при push в main) |
| Аутентификация | Supabase Auth (email/password) |

**Исходные документы:**
1. `.claude/VIBE_CODING_WORKFLOW.md` — конституция, процесс, тиры, триггеры
2. `CLAUDE.md` (генерируется на этапе 0) — правила проекта
3. `KPI_System_Technical_Specification.md` — полное ТЗ бизнес-логики
4. `PROJECT_CONTEXT.md` — карта файлов и статус (из v1, как reference)
5. `UI_PATTERNS.md` — UI-решения (из v1, как reference для бизнес-логики UI)
6. `.claude/workflow/MODEL_ROUTING_GUIDE.md` — логика выбора модели для агентов
7. Этот файл (`MASTER_PLAN.md`) — порядок выполнения

**Связь с Vibe-Coding Framework:**
Этот план НЕ заменяет `.claude/VIBE_CODING_WORKFLOW.md`. Claude Code в каждой сессии СНАЧАЛА читает CLAUDE.md → VIBE_CODING_WORKFLOW.md (определяет тир, активирует механизмы по TRIGGER_MAP), ЗАТЕМ находит текущий этап в этом плане. Правила из framework (CYCLE.md, TRIGGER_MAP.md, ARCHITECTURE_PRINCIPLES.md, database-workflow.md) имеют приоритет над этим планом при конфликте.

**Git convention:** `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:` — conventional commits (из git-workflow.md). Ветки: `feature/название`, `fix/описание`.

**Принцип работы:** Каждый этап — самодостаточный. Claude Code находит текущий этап (по чеклисту), выполняет по CYCLE.md (STANDARD тир), отмечает завершение. Пользователь проверяет результат и запускает следующую сессию.

---

## ЭТАП 0 — Инфраструктура + Framework + CLAUDE.md
**Статус:** ⬜ Не начат
**Требует участия пользователя:** ДА (создание Supabase проекта, передача credentials)
**Ожидаемое время:** 1 сессия

### Задача
Создать все необходимые ресурсы: GitHub repo, Supabase проект, скопировать framework, сгенерировать CLAUDE.md через blueprint.

### Что сделать

**Инфраструктура:**
1. Создать GitHub репозиторий `KPI-System-2` (public, MIT, Node .gitignore)
2. Клонировать в рабочую директорию
3. Создать новый Supabase проект (имя: `kpi-system-2`, регион: West EU Ireland)
4. Получить credentials: URL, anon key, service role key
5. Настроить Vercel: подключить GitHub repo, добавить environment variables

**Framework:**
6. Папка `.claude/` уже скопирована в корень проекта (53 файла)
7. Верификация: hooks/lib/ (4 JS), hooks/scripts/ (5 JS), workflow/ (10 .md включая LEARNED_PATTERNS.md и MODEL_ROUTING_GUIDE.md), agents/ (5 .md), skills/ (4 SKILL.md)
8. Связать Supabase проект через plugin (предпочтительно) или CLI: `npx supabase link --project-ref <new-ref>`

**CLAUDE.md:**
9. Claude Code читает `.claude/blueprints/CLAUDE_MD_BLUEPRINT.md`
10. Определяет тир: STANDARD (≥3 критерия: 200 пользователей, финансовые расчёты, PII, масштабирование, срок — годы)
11. Определяет модульную структуру из бизнес-домена (см. этап 1 — структура)
12. Задаёт пользователю вопросы типа C (blueprint): тема — тёмная (уже решено), шрифты — на усмотрение Claude Code
13. Генерирует `CLAUDE.md` по шаблону, показывает на утверждение
14. После утверждения — коммит

**Настройка STANDARD тира (из PLUGINS_AND_TOOLS.md чеклиста):**
15. Plugins уже установлены глобально (8 шт: code-review, code-simplifier, context7, frontend-design, github, security-guidance, supabase, typescript-lsp)
16. Hooks — скопированы из framework (hooks.json + 5 scripts + 4 lib)
17. settings.local.json — скопирован из framework (sonnet default, MAX_THINKING_TOKENS=10000, SUBAGENT_MODEL=haiku)
18. `.env.local.example` с переменными Supabase
19. `.github/workflows/ci.yml` по шаблону из CLAUDE_MD_BLUEPRINT.md

**Живые документы:**
20. Создать `KPI_System_Technical_Specification.md` — скопировать из v1 as-is (бизнес-логика идентична), обновить:
    - Раздел 15 (стек) — целевой стек v2
    - Раздел 2.1 (навигация) — заменить «через state (`activePage`) в `AppLayout.jsx`» на «через Next.js App Router (URL-based, deep links)»
    - Все упоминания `.jsx` расширений → `.tsx`
    - Историю изменений: добавить v2.0
21. Создать `PROJECT_CONTEXT.md` — новый (структура файлов v2, пустой раздел статуса)
22. Создать `UI_PATTERNS.md` — новый (shadcn/ui dark mode, основные решения из v1 адаптированные)
23. Создать `CODE_LEARNINGS.md` — пустой с заголовком

### Критерий готовности
- GitHub repo создан, `.claude/` на месте, CLAUDE.md сгенерирован
- Supabase проект создан, credentials в `.env.local`
- Vercel подключён
- CI workflow на месте
- `git log` показывает начальный коммит
- Живые документы на месте

### Чеклист
- [ ] GitHub repo создан
- [ ] Supabase проект создан
- [ ] Vercel подключён
- [ ] `.claude/` скопирован из framework
- [ ] CLAUDE.md сгенерирован через blueprint и утверждён
- [ ] `.env.local` с credentials
- [ ] `.github/workflows/ci.yml` создан
- [ ] Живые документы созданы (ТЗ обновлено: раздел 15, раздел 2.1, .jsx→.tsx; PROJECT_CONTEXT, UI_PATTERNS, CODE_LEARNINGS)
- [ ] Начальный коммит запушен

---

## ЭТАП 1 — Скелет проекта + тёмная тема + интерактивный Design Showcase
**Статус:** ⬜ Не начат
**Требует участия пользователя:** ДА (утверждение дизайна после завершения этапа)
**Ожидаемое время:** 1 сессия

### Задача
Инициализировать Next.js проект, установить зависимости, настроить shadcn/ui dark mode, создать структуру директорий, и собрать интерактивную страницу `/design` со всеми UI-примитивами для утверждения пользователем.

### Что сделать

**Проект и зависимости:**
1. `npx create-next-app@latest` — App Router, TypeScript strict, Tailwind, src directory, ESLint
2. Установить зависимости:
   - `@supabase/supabase-js @supabase/ssr` — Supabase
   - `@tanstack/react-query` — server state
   - `react-hook-form @hookform/resolvers zod` — формы
   - `lucide-react` — иконки
   - `recharts` — графики
   - `xlsx` — импорт Excel
   - Dev: `vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react jsdom prettier`

3. shadcn/ui: `npx shadcn@latest init` — dark theme по умолчанию
4. Установить shadcn/ui компоненты: Button, Input, Select, Textarea, Checkbox, Switch, Dialog, Card, Table, Badge, Progress, Tabs, Separator, Label, DropdownMenu, Sheet, Tooltip, Sidebar

**Структура `/src`** (из ARCHITECTURE_PRINCIPLES.md — feature-based модули):
```
src/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx                # AppLayout с sidebar
│   │   ├── page.tsx                  # Dashboard (роутинг по роли)
│   │   ├── kpi-cards/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── library/page.tsx
│   │   ├── participants/page.tsx
│   │   ├── trigger-goals/page.tsx
│   │   ├── approvals/page.tsx
│   │   ├── events/page.tsx
│   │   ├── dictionaries/page.tsx
│   │   ├── archive/page.tsx
│   │   └── profile/page.tsx
│   ├── design/page.tsx               # ← Design Showcase (удаляется после утверждения)
│   ├── api/                          # Server routes
│   ├── layout.tsx
│   └── globals.css
├── features/
│   ├── kpi-cards/                    # Модуль: карты KPI
│   │   ├── components/
│   │   ├── hooks/
│   │   └── types.ts
│   ├── kpi-library/                  # Модуль: библиотека
│   ├── participants/                 # Модуль: участники
│   ├── trigger-goals/                # Модуль: запускающие цели
│   ├── dashboard/                    # Модуль: дашборды
│   └── shared/                       # Общие компоненты
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── calculations.ts
│   ├── constants.ts
│   └── utils.ts
├── types/
│   ├── database.ts
│   └── kpi.ts
└── __tests__/
```

**ESLint + Prettier + Vitest:**
5. ESLint + Prettier конфигурация
6. `vitest.config.ts`
7. Placeholder pages (каждая — заглушка с заголовком)

**Design Showcase — страница `/design`:**

Интерактивная страница с реальными shadcn/ui компонентами в dark mode. Пользователь открывает `/design` в браузере, взаимодействует с компонентами (клик, hover, ввод), оценивает внешний вид и отправляет правки.

8. Создать `src/app/design/page.tsx` с секциями:

   **8.1 Палитра и типографика:**
   - Все цвета темы (background, card, primary, secondary, muted, accent, destructive) — плашки с HEX
   - Заголовки h1–h4, body text, caption, моноширинный текст для чисел

   **8.2 Кнопки (все варианты):**
   - Primary, Secondary, Ghost, Outline, Destructive, Link
   - Состояния: default, hover (навести), disabled, loading (со спиннером)
   - Размеры: default, sm, lg, icon

   **8.3 Формы (интерактивные):**
   - Input: текст, email, number — с placeholder, с label, с ошибкой валидации
   - Select: с опциями, с placeholder
   - Textarea: с placeholder
   - Checkbox, Switch (toggle)
   - Пример формы «Создание участника»: grid ФИО + email + роль + кнопки

   **8.4 Карточки:**
   - Metric card: число (mono, крупный) + label (uppercase, мелкий)
   - List card: заголовок + описание + badge статуса
   - Detail card: с секциями, разделителями

   **8.5 Таблицы (с данными-заглушками):**
   - Header (uppercase, muted), строки с hover, sortable columns
   - Пример: таблица «Участники» с 5 строками mock-данных
   - Пример: таблица «Карты KPI» с progress bar и status badge

   **8.6 Badges и статусы:**
   - Статусы карт: Черновик (gray), Активна (blue), На согласовании (yellow), Утверждена (green), Возвращена (red)
   - Роли: Администратор (blue), Согласующий (teal), Участник (gray)
   - Метод оценки: scale, binary, discrete, manual

   **8.7 Модальные окна (открываются по клику):**
   - Стандартная модалка (640px) — с формой
   - Большая модалка (900px) — с tabs
   - Confirm dialog — «Вы уверены?» + кнопки

   **8.8 Progress bar:**
   - Три варианта: <80% (red), ≥80% (yellow), ≥100% (green)
   - С числовым значением рядом

   **8.9 Empty state:**
   - Иконка (muted) + заголовок + описание + кнопка действия

   **8.10 Sidebar навигация:**
   - Mock sidebar с иконками lucide-react
   - Группировка: Admin menu / Approver menu / Participant menu
   - Активный пункт подсвечен

   **8.11 Breadcrumb + page header:**
   - «Карты KPI › Иванов Иван — Q1 2026»
   - Кнопка «Назад»

   **8.12 Формула вознаграждения:**
   - Визуальный блок: Оклад × Кол-во окладов × % запускающей цели × % KPI = Итог
   - Каждый компонент — отдельный блок с числом и label

   **8.13 Графики (recharts с mock-данными):**
   - Горизонтальный bar chart (исполнение по участникам)
   - Donut chart (распределение по статусам)

Все компоненты интерактивны: кнопки кликабельны, инпуты принимают ввод, модалки открываются/закрываются, select'ы раскрываются.

### Процесс утверждения дизайна
1. Claude Code заканчивает этап → пользователь открывает `localhost:3000/design`
2. Пользователь взаимодействует с компонентами, проверяет:
   - Цвета (контраст, читаемость)
   - Шрифты (размеры, начертания)
   - Кнопки и формы (hover, focus, состояния)
   - Таблицы и карточки (плотность, отступы)
3. Пользователь говорит «утверждаю» или описывает правки
4. После утверждения — страница `/design` удаляется из проекта (она временная)

### Критерий готовности
- `npm run dev` — стартует без ошибок
- `npm run build` — проходит
- `npm run lint` — 0 errors
- `/design` отображает все секции (8.1–8.13)
- Все компоненты интерактивны
- Тёмная тема работает
- Пользователь утвердил дизайн

### Чеклист
- [ ] Next.js инициализирован
- [ ] Все зависимости установлены
- [ ] shadcn/ui + dark mode настроен
- [ ] Структура директорий создана
- [ ] ESLint + Prettier + Vitest настроены
- [ ] Placeholder pages на месте
- [ ] Страница `/design` с секциями 8.1–8.13
- [ ] Build проходит
- [ ] **Пользователь утвердил дизайн**

---

## ЭТАП 2 — База данных + типы + RLS
**Статус:** ✅ Завершён (2026-04-14)
**Требует участия пользователя:** НЕТ
**Ожидаемое время:** 1 сессия

### Задача
Создать схему БД в Supabase. Enforced RLS. TypeScript типы. Rollback-файлы.

### Что сделать
1. SQL-миграция со всеми таблицами (раздел 14 Technical Specification)
2. Rollback SQL для каждой миграции (сохранить в `supabase/rollbacks/` — по database-workflow.md)
3. Enforced RLS-политики (детали — см. оригинальный MASTER_PLAN, раздел этап 2, пункт 3)
4. Seed-данные: справочники «Уровень участника», «Роль в компании», admin-пользователь
5. Сгенерировать типы: `npx supabase gen types typescript`
6. Бизнес-типы в `src/types/kpi.ts`
7. PostgreSQL-функции: `approve_card_line`, `calculate_card_reward`

**По database-workflow.md:** Перед каждой миграцией — интроспекция → rollback SQL → execute → верификация.

### Критерий готовности
- Все таблицы созданы
- RLS включён и enforced
- Типы сгенерированы и компилируются
- Rollback-файлы на месте
- Seed-данные загружены

### Чеклист
- [x] SQL-миграция выполнена (миграции 01–09 применены)
- [x] Rollback SQL создан для каждой миграции (supabase/rollbacks/)
- [x] RLS-политики включены (все 18 таблиц, enforced)
- [x] PostgreSQL-функции созданы (approve_card_line, unapprove_card_line, calculate_card_reward)
- [x] Типы сгенерированы (src/types/database.ts)
- [x] Бизнес-типы написаны (src/types/kpi.ts)
- [x] Seed-данные загружены (2 справочника, 5 значений, 1 admin)
- [x] Верификация схемы пройдена (18 таблиц, RLS enabled on all)

---

## ЭТАП 3 — Аутентификация + Layout + Роутинг
**Статус:** ⬜ Не начат
**Требует участия пользователя:** НЕТ
**Ожидаемое время:** 1 сессия

### Задача
Auth через Supabase, middleware, AppLayout с sidebar, role-based routing.

### Что сделать
1. Supabase auth middleware (`middleware.ts`)
2. Auth context (`use-auth.ts`): session, profile, roles, signIn, signOut
3. Login page: RHF + Zod, shadcn/ui Card + Input + Button
4. AppLayout: sidebar с навигацией по ролям (раздел 2.1 ТЗ), header, responsive
5. Role-based route protection
6. TanStack Query provider в root layout

### Критерий готовности
- Логин работает
- Sidebar показывает меню по роли
- URL-навигация работает (Browser Back/Forward)
- Неавторизованный → редирект на login

### Чеклист
- [ ] Middleware настроен
- [ ] Auth context работает
- [ ] Login page работает
- [ ] AppLayout с sidebar по ролям
- [ ] Role-based routing
- [ ] TanStack Query provider

---

## ЭТАП 4 — calculations.ts + тесты
**Статус:** ⬜ Не начат
**Требует участия пользователя:** НЕТ
**Ожидаемое время:** 1 сессия

### Задача
Все формулы расчёта с полной типизацией. Unit-тесты (≥30). TDD для бизнес-логики (по CYCLE.md STANDARD).

### Что сделать
1. `src/lib/calculations.ts` — все функции из раздела 3–6 ТЗ, полная типизация
2. `src/lib/constants.ts` — METHOD_LABELS, UNIT_OPTIONS, STATUS_LABELS, STATUS_COLORS
3. `src/__tests__/calculations.test.ts` — ≥30 тестов (TDD: написать тесты → реализовать → verify)

### Критерий готовности
- `npm run test` — все тесты зелёные
- `npm run typecheck` — 0 errors
- Формулы идентичны текущей реализации (ТЗ — source of truth)

### Чеклист
- [ ] calculations.ts с полной типизацией
- [ ] constants.ts
- [ ] ≥30 unit-тестов
- [ ] Все тесты проходят

---

## ЭТАП 5 — Data layer (TanStack Query hooks)
**Статус:** ⬜ Не начат
**Требует участия пользователя:** НЕТ
**Ожидаемое время:** 1 сессия

### Задача
Типизированный data layer: все Supabase-запросы через TanStack Query hooks. По ARCHITECTURE_PRINCIPLES.md принцип 10 — изоляция data access.

### Что сделать
Hooks по модулям (features/):
1. `features/kpi-cards/hooks/` — useKpiCards, useKpiCard, useCreateCard, useUpdateFact, useSubmitForApproval, useApproveLine, useReturnLine, useUnapproveLine, useReturnCard, useDeleteLine
2. `features/kpi-library/hooks/` — useKpiLibrary, useCreateKpi, useUpdateKpi, useDeleteKpi, useDuplicateKpi
3. `features/participants/hooks/` — useParticipants, useCreateParticipant, useUpdateParticipant, useResetPassword, useImportParticipants
4. `features/trigger-goals/hooks/` — useTriggerGoals, CRUD, useUserTriggerGoalData
5. `features/shared/hooks/` — useDictionaries, useEvents, useAuditLog

Каждый hook: типизирован, обрабатывает ошибки, query keys для инвалидации.

### Критерий готовности
- Все hooks компилируются
- Typecheck проходит
- Тестовый запрос из приложения загружает данные из Supabase

### Чеклист
- [ ] kpi-cards hooks
- [ ] kpi-library hooks
- [ ] participants hooks
- [ ] trigger-goals hooks
- [ ] shared hooks (dictionaries, events, audit)
- [ ] Typecheck проходит

---

## ЭТАП 6 — Серверные API routes
**Статус:** ⬜ Не начат
**Требует участия пользователя:** НЕТ
**Ожидаемое время:** 1 сессия

### Задача
Критическая бизнес-логика на сервере (по ARCHITECTURE_PRINCIPLES.md принцип 9 — серверная валидация как source of truth).

### Что сделать
1. `app/api/cards/approve-line/route.ts` — атомарное согласование
2. `app/api/cards/return-line/route.ts` — возврат с комментарием
3. `app/api/cards/submit/route.ts` — отправка на согласование
4. `app/api/reward/calculate/route.ts` — серверный расчёт вознаграждения
5. Auth middleware для API routes

### Критерий готовности
- API routes корректно обрабатывают запросы
- 400/403 при невалидных запросах
- Атомарность: approve — одна транзакция
- Серверный reward === клиентский (для тех же данных)

### Чеклист
- [ ] approve-line route
- [ ] return-line route
- [ ] submit route
- [ ] reward calculate route
- [ ] Auth middleware
- [ ] Тесты

---

## ЭТАП 7 — Дашборды
**Статус:** ⬜ Не начат
**Требует участия пользователя:** НЕТ
**Ожидаемое время:** 1 сессия

### Задача
Три дашборда по ролям. Точка входа после логина. Графики recharts.

### Что сделать
1. `(dashboard)/page.tsx` — определяет роль → рендерит соответствующий дашборд
2. AdminDashboard: 4 метрики + ExecutionByUserChart + StatusDistributionChart + таблица карт + сводная вознаграждений
3. ApproverDashboard: 2 метрики + pending карты + свои карты
4. ParticipantDashboard: 3 метрики + список карт

### Чеклист
- [ ] AdminDashboard с графиками
- [ ] ApproverDashboard
- [ ] ParticipantDashboard
- [ ] Навигация на карты через URL

---

## ЭТАП 8 — Библиотека KPI
**Статус:** ⬜ Не начат
**Требует участия пользователя:** НЕТ
**Ожидаемое время:** 1–2 сессии

### Задача
Полная реализация библиотеки KPI с декомпозицией (≤300 строк на компонент — ARCHITECTURE_PRINCIPLES принцип 1).

### Что сделать
1. `library/page.tsx` — оркестратор
2. Компоненты: KpiModal, KpiPeriodPicker, ScaleRangesEditor, DiscretePointsEditor, DiscreteTargetField, KpiPropertiesEditor
3. Фильтры: поиск + метод + единица + период + динамические по свойствам
4. Копирование с проверкой дубликатов
5. Auto-linkage (binary↔да/нет, discrete→target=1)

### Чеклист
- [ ] Таблица + фильтры
- [ ] KpiModal с валидацией
- [ ] Все sub-editors
- [ ] Копирование с проверкой дубликатов

---

## ЭТАП 9 — Карты KPI (главная механика)
**Статус:** ⬜ Не начат
**Требует участия пользователя:** НЕТ
**Ожидаемое время:** 2 сессии

### Задача
Самый сложный этап. Карты KPI: список, детальная страница (URL-addressable), workflow согласования, ввод факта, составные KPI, формула вознаграждения.

### Что сделать
1. `kpi-cards/page.tsx` — список с фильтрами
2. `kpi-cards/[id]/page.tsx` — детальная карта (deep link)
3. Компоненты: KpiCardHeader, KpiCardReward, TriggerGoalBlock, KpiLineRow, L2LineRow, FactInput, AddLineModal, CommentModal, KpiCardAudit
4. Полный workflow: ввод факта → авторасчёт → отправка → согласование → автоутверждение
5. Составные KPI: weighted + additive
6. Формула вознаграждения с live-пересчётом
7. Unapprove + Return

### Чеклист
- [ ] Список карт с фильтрами
- [ ] Детальная страница
- [ ] Все подкомпоненты
- [ ] Workflow: submit → approve → auto-approve
- [ ] Unapprove + Return
- [ ] Составные KPI (оба типа)
- [ ] Формула вознаграждения

---

## ЭТАП 10 — Остальные страницы
**Статус:** ⬜ Не начат
**Требует участия пользователя:** НЕТ
**Ожидаемое время:** 1–2 сессии

### Что сделать
1. Участники (CRUD + signUp + импорт Excel + сброс пароля)
2. Запускающие цели (CRUD + официальный факт)
3. Справочники (двухпанельный layout + CRUD + show_in_filters)
4. Согласование (список pending + клик → карта)
5. Лента событий
6. Архив (read-only approved)
7. Профиль (смена пароля)

### Чеклист
- [ ] Участники
- [ ] Запускающие цели
- [ ] Справочники
- [ ] Согласование
- [ ] Лента событий
- [ ] Архив
- [ ] Профиль

---

## ЭТАП 11 — Финализация + деплой
**Статус:** ⬜ Не начат
**Требует участия пользователя:** ДА (финальная проверка)
**Ожидаемое время:** 1 сессия

### Что сделать
1. E2E smoke test: логин → создать участника → создать KPI → создать карту → ввести факт → согласовать → проверить approved
2. Vercel deployment: проверить production build
3. /update-docs — обновить все живые документы
4. Финальный /code-review всего проекта

### Чеклист
- [ ] E2E smoke test пройден
- [ ] Vercel production работает
- [ ] Живые документы обновлены
- [ ] Финальный code-review пройден

---

## Сводка

| Этап | Название | Сессий | Участие пользователя |
|------|----------|--------|---------------------|
| 0 | Инфраструктура + Framework + CLAUDE.md | 1 | ДА (Supabase credentials) |
| 1 | Скелет + тёмная тема + Design Showcase | 1 | ДА (утверждение дизайна) |
| 2 | БД + типы + RLS + rollback | 1 | НЕТ |
| 3 | Auth + Layout + Роутинг | 1 | НЕТ |
| 4 | calculations.ts + тесты | 1 | НЕТ |
| 5 | Data layer (hooks) | 1 | НЕТ |
| 6 | Серверные API routes | 1 | НЕТ |
| 7 | Дашборды | 1 | НЕТ |
| 8 | Библиотека KPI | 1–2 | НЕТ |
| 9 | Карты KPI | 2 | НЕТ |
| 10 | Остальные страницы | 1–2 | НЕТ |
| 11 | Финализация | 1 | ДА (проверка) |
| **Итого** | | **13–15** | **3 точки участия** |

---

## Связь с Vibe-Coding Framework

Этот план работает ВНУТРИ framework, не вместо него:

- **CLAUDE.md** → генерируется на этапе 0 через CLAUDE_MD_BLUEPRINT.md
- **VIBE_CODING_WORKFLOW.md** → читается в начале каждой сессии, определяет порядок работы
- **TRIGGER_MAP.md** → определяет, какие skills/agents активировать для каждой задачи внутри этапа
- **CYCLE.md** → определяет полный цикл: code → lint → typecheck → test → commit → push → PR → review → merge → update-docs → retrospective
- **ARCHITECTURE_PRINCIPLES.md** → ≤300 строк, feature-based модули, ViewModel + mapper, изоляция data access
- **MODEL_ROUTING_GUIDE.md** → sonnet по умолчанию, opus только для planner, haiku для субагентов
- **database-workflow.md** → обязательный pipeline с rollback для этапа 2 и любых будущих миграций
- **Error Recovery Protocol** → 3 попытки → СТОП → описать проблему → предложить альтернативы
- **LEARNED_OVERRIDES.md** → растёт с каждым merge, оптимизирует маршрутизацию механизмов
- **LEARNED_PATTERNS.md** → растёт с каждым merge, накапливает технические паттерны для повторного использования
- **backport-analyzer.js** → после merge анализирует универсальные знания для переноса в framework-репо
- **CONTEXT_MANAGEMENT.md** → autocompact 50%, suggest-compact, session persistence

### Ultraplan

Пока идёт реализация по этому мастер-плану (этапы 0–11) — Ultraplan НЕ используется. Каждый этап уже декомпозирован. Ultraplan триггернётся при добавлении новых механик, выходящих за рамки текущего ТЗ (по критериям из TRIGGER_MAP.md).
