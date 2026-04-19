# UI_PATTERNS.md
> Живой справочник принятых UI-решений. Новые предложения не должны противоречить зафиксированным паттернам. При реализации нового UI-решения — фиксируй его в этом файле.
>
> **v2 стек:** shadcn/ui (dark) + Tailwind CSS v4. Все компоненты — shadcn primitives, кастомные — только когда shadcn не покрывает.

---

## Дизайн-система

### Цветовая палитра (shadcn/ui CSS-переменные, dark mode)

Вместо v1 custom CSS variables используются shadcn/ui tokens:

| v1 переменная | shadcn/ui token | Примерное значение |
|---|---|---|
| `--bg: #0b0f1a` | `--background` | deep navy |
| `--surface: #111827` | `--card` | card background |
| `--surface2: #1a2235` | `--muted` | muted areas |
| `--surface3: #1f2d42` | `--muted` (hover) | hover states |
| `--border: #1e2d45` | `--border` | primary border |
| `--accent: #3b7dd8` | `--primary` | primary action |
| `--accent2: #0ea5b0` | `--secondary` (custom) | teal accent |
| `--success: #10b981` | `--success` (custom) | green |
| `--warning: #f59e0b` | `--warning` (custom) | yellow |
| `--danger: #ef4444` | `--destructive` | red |
| `--text: #e2e8f0` | `--foreground` | primary text |
| `--text2: #94a3b8` | `--muted-foreground` | secondary text |

> Кастомные токены (`--success`, `--warning`, `--secondary` как teal) добавляются в `globals.css` в `.dark {}` блоке.

### Шрифты

- Основной: `Geologica` — CSS var `--font-sans` (Next.js local font)
- Моноширинный: `JetBrains Mono` — CSS var `--font-mono` (Next.js local font)
- Применение mono: числа в метриках, коды, формулы (`font-mono` Tailwind class)

### Скругления

- Кнопки, инпуты: `rounded-md` (≈ 6px, shadcn default)
- Карточки, диалоги: `rounded-lg` (≈ 12px)

---

## Паттерны компонентов

### Переключатель-сегмент (toggle segment)

- **shadcn primitив:** `ToggleGroup` + `ToggleGroupItem`
- **Когда:** выбор из 2–4 взаимоисключающих вариантов
- **Стиль:** `variant="outline"` внутри bordered контейнера, активная опция — `bg-primary text-primary-foreground`
- **Примеры:**
  - «За период» / «На дату» в блоке «Период» формы KPI
  - «Официальное» / «Моделирование» в блоке запускающей цели карты

### Сетка пресетов (preset grid)

- **shadcn primitив:** `ToggleGroup` c `className="grid grid-cols-4 gap-1.5"`
- **Когда:** выбор из 4–8 вариантов (периоды: Q1, Q2, Q3, Q4, H1, H2, год, произвольно)
- **Стиль:** `ToggleGroupItem` с `text-xs px-2 py-1.5`, активная — `bg-primary text-primary-foreground`

### Быстрый выбор (quick select popup)

- **shadcn primitив:** `Popover` (заменяет ручной absolute-popup)
- **Когда:** поле с ограниченным набором популярных значений
- **Стиль:** `PopoverContent` с `className="flex gap-1 p-2"`, кнопки `variant="outline" size="sm"`
- **Пример:** `DiscreteTargetField` — быстрый выбор [1, 2, 3]

### Metric card (метрическая карточка)

- **shadcn primitив:** `Card` + `CardContent`
- **Стиль:** `<Card className="bg-muted/50">` + label `text-xs uppercase tracking-widest text-muted-foreground` + value `font-mono text-2xl font-bold`
- **Пример:** «Участников», «Карт KPI», «Утверждено» на Admin Dashboard

### Progress bar

- **shadcn primitив:** `Progress`
- **Когда:** визуализация % исполнения
- **Цвет по порогам:**
  - `>=100%` → `[&>div]:bg-success`
  - `>=80%` → `[&>div]:bg-warning`
  - `<80%` → `[&>div]:bg-destructive`
- **Пример:** колонка «% исполнения» в таблице Admin Dashboard

### Empty state

- **Когда:** список или раздел пуст
- **Стиль:** `flex flex-col items-center justify-center py-16 gap-3` + иконка `opacity-30 size-12` + title `text-sm font-medium` + subtitle `text-xs text-muted-foreground`
- Нет готового shadcn примитива — используем `div`

### Кнопка «Назад» + breadcrumb

- **shadcn примитив:** `Breadcrumb` + `BreadcrumbList` + `BreadcrumbItem` + `BreadcrumbSeparator`
- **Плюс:** `Button variant="ghost" size="sm"` с иконкой `ArrowLeft`
- **Пример:** «Карты KPI › Иванов Иван — Q1 2026»

### Формула вознаграждения

- **Нет готового shadcn примитива** — кастомный компонент `RewardFormula`
- **Стиль:** `flex flex-wrap items-center gap-4` + каждый компонент `flex flex-col items-center` + operator `text-muted-foreground text-lg` + result `bg-primary/10 border border-primary rounded-md px-3 py-2`

### Badge статуса карты

- **shadcn примитив:** `Badge`
- **Варианты по статусу:**

| Статус | variant | label |
|---|---|---|
| `draft` | `secondary` | Черновик |
| `submitted` | `outline` | На согласовании |
| `approved` | `default` (green custom) | Утверждена |
| `rejected` | `destructive` | Отклонена |
| `closed` | `secondary` | Закрыта |

### Иконка-toggle в списке

- **shadcn примитив:** `Button variant="ghost" size="icon"`
- **Стиль:** `text-primary` когда включено, `text-muted-foreground/30` когда выключено
- **Пример:** toggle `show_in_filters` в списке справочников

---

## Паттерны форм

### Модальная форма создания/редактирования

- **shadcn примитив:** `Dialog` + `DialogContent` + `DialogHeader` + `DialogFooter`
- **Размеры:**
  - Большие формы (KPI, участник): `className="max-w-3xl"`
  - Стандартные: `className="max-w-lg"` (shadcn default)
  - Простые (подтверждение): `className="max-w-sm"`
- **Структура:** `DialogHeader` (title) → `DialogContent` (`flex flex-col gap-4`) → `DialogFooter` (Отмена + Сохранить)
- **Form library:** React Hook Form + Zod + shadcn `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`

### Форма участника

- ФИО: `grid grid-cols-3 gap-3` (Фамилия*, Имя*, Отчество)
- Email + Пароль: `grid grid-cols-2 gap-3` (при создании — пароль, при редактировании — кнопка «Сбросить»)
- Роль + Уровень: `grid grid-cols-2 gap-3`
- Роль в компании + Согласующий: `grid grid-cols-2 gap-3`
- Separator + заголовок «Базовое вознаграждение»
- Оклад + Кол-во окладов: `grid grid-cols-2 gap-3`

### Связанные поля (auto-linkage)

- Выбор единицы «да / нет» → метод переключается на «бинарный» (watch + setValue в RHF)
- Выбор метода «бинарный» → единица = «да / нет»
- Выбор метода «дискретный» → target=1, unit=шт.
- Смена метода с бинарного → единица сбрасывается

### Дублирование (copy mode)

- **Кнопка:** `Button variant="ghost" size="icon"` с иконкой `Copy` в строке таблицы
- **Поведение:** открывает `Dialog` с предзаполненными данными, title «Копия KPI»
- **Защита:** перед сохранением — проверка дубликатов (название, метод, цель, единица, период, свойства)
- **Ошибка:** `Alert variant="destructive"` внизу `DialogFooter`

### Inline-ввод факта

- `Button variant="ghost" size="icon"` с иконкой `Pencil` на строке KPI → разворачивается `Collapsible` под строкой
- Binary: две `Button` — «Да» / «Нет» (`variant="default"` / `variant="outline"` по выбору)
- Manual: `Input` «% исполнения» + Сохранить / Отмена
- Scale/Discrete: `Input` «Фактическое значение» + `Textarea` «Комментарий» + кнопки

### CommentModal

- **shadcn примитив:** `Dialog` с `className="max-w-sm z-[200]"` (поверх других диалогов)
- `Textarea` + `DialogFooter` с Отмена/Подтвердить
- `required=true` → кнопка Подтвердить `disabled` пока textarea пустая

### Диалог подтверждения сброса пароля

- Inline-блок в форме участника (`AlertDialog` или кастомный блок)
- `className="rounded-lg border border-primary bg-primary/5 p-4"`
- Текст: «Сбросить пароль для **Имя**? Ссылка будет отправлена на **email**»
- Кнопки: `Button variant="default"` (Подтвердить) + `Button variant="outline"` (Отмена)

### PasswordModal (одноразовый показ пароля)

- **shadcn примитив:** `Dialog`
- **Когда:** после создания участника или сброса пароля — показать temp password один раз
- **Ключевые правила:**
  - Пароль отображается в `<code>` блоке, кнопка копирования рядом (`Copy` иконка)
  - `data-testid="password-modal"`, `data-testid="password-value"`, `data-testid="copy-password-btn"`, `data-testid="close-password-btn"`
  - Явное предупреждение: «Запишите пароль — он больше не будет показан»
  - `mode: "created" | "reset"` меняет заголовок и текст предупреждения
- **Пример:** `src/features/participants/components/password-modal.tsx`

### ParticipantFormModal

- **shadcn примитив:** `Dialog` + `className="sm:max-w-lg"`
- **RHF + Zod:** числовые поля (baseSalary, salaryMultiplier) хранятся как `z.string().optional()` в схеме, `parseFloat()` в submit handler — избегает конфликта типов с RHF Control
- **Layout:**
  - ФИО: `grid grid-cols-3 gap-3` (Фамилия*, Имя*, Отчество)
  - Email + Роль: `grid grid-cols-2 gap-3` (email disabled при mode="edit")
  - Оклад + Мультипликатор: `grid grid-cols-2 gap-3`
- `data-testid`: `participant-form-modal`, `participant-form`, `input-last-name`, `input-first-name`, `input-middle-name`, `input-work-email`, `select-system-role`, `input-base-salary`, `input-salary-multiplier`, `form-cancel-btn`, `form-submit-btn`

### ExcelImportModal

- **shadcn примитив:** `Dialog` + `className="sm:max-w-2xl"`
- **Drag-and-drop зона:** `border-2 border-dashed` + `onDrop` / `onDragOver` / `onDragLeave`; скрытый `<input type="file">` с ref
- **Парсинг:** `await import("xlsx")` — динамический импорт (пакет `xlsx` должен быть установлен)
- **Ограничения:** только `.xlsx` / `.xls`, максимум 500 строк
- **COLUMN_MAP:** маппинг заголовков Excel → поля схемы (русские и английские варианты)
- **Preview table:** показывает до 20 строк; ошибки валидации — до 5 штук с «...и ещё N»
- `data-testid`: `excel-import-modal`, `excel-drop-zone`, `excel-browse-btn`, `excel-file-input`, `excel-remove-file-btn`, `excel-parse-errors`, `import-result`, `import-cancel-btn`, `import-submit-btn`

### Таблица участников (ParticipantsTable)

- **shadcn примитив:** `Table` стандарт + `DropdownMenu` для действий
- **Колонки:** ФИО | Email | Роль (Badge) | Статус (Badge) | Действия (DropdownMenu)
- **Неактивные строки:** `opacity-50` через `className={p.isActive ? "" : "opacity-50"}`
- **DropdownMenuTrigger:** НЕ использовать `asChild` (Base UI не поддерживает) — стилизовать напрямую через `className`
- `data-testid`: `participants-table`, `participants-empty`, `participant-row-{id}`, `participant-actions-{id}`, `action-edit-{id}`, `action-reset-password-{id}`, `action-toggle-active-{id}`

### Валидация (RHF + Zod)

- **Inline-ошибки:** `FormMessage` под каждым полем (shadcn стандарт, `text-destructive text-xs`)
- **Обязательные поля:** звёздочка в `FormLabel` (`<span className="text-destructive">*</span>`)
- **Alert-ошибки:** `Alert variant="destructive"` для критических ошибок формы
- **Предупреждение незаполненных фактов:** `Alert` с `AlertTriangle` иконкой, `variant="warning"` (custom)
- **Сумма весов:** `Badge` с `variant="outline"` — зелёный border если валидно, красный если нет

---

## Паттерны таблиц и списков

### Структура таблиц

- **shadcn примитив:** `Table` + `TableHeader` + `TableBody` + `TableRow` + `TableHead` + `TableCell`
- Wrapper: `<div className="rounded-lg border overflow-hidden">`
- `TableHead`: `uppercase text-xs tracking-widest text-muted-foreground bg-muted/50`
- `TableCell`: `text-sm py-2.5 px-3.5`
- Hover: `TableRow className="hover:bg-muted/20 transition-colors"`

### Таблица библиотеки KPI

- Колонки: Название | Метод | Период | Единица | Цель | Действия
- Действия: иконки `Edit` + `Copy` + `Trash2` (ghost icon buttons)
- Группировка по категориям: `TableRow` с colspan как separator + category badge

### Таблица карт KPI (admin view)

- Колонки: Участник | Период | Статус | % исполнения | Вознаграждение | Действия
- `% исполнения`: `Progress` + число рядом
- `Статус`: `Badge` (см. паттерн Badge статуса выше)

### Пагинация

- **shadcn примитив:** `Pagination` + `PaginationContent` + `PaginationItem` + `PaginationPrevious` / `PaginationNext`
- Показывать при > 20 записей

### Поиск и фильтры

- `Input` с иконкой `Search` слева (`<div className="relative">`)
- `Select` для фильтров по статусу/периоду/участнику
- Layout: `flex items-center gap-2` над таблицей

---

## Паттерны навигации

### Sidebar

- **shadcn примитив:** нет готового — кастомный `Sidebar` компонент
- `w-64 bg-card border-r flex flex-col`
- Логотип/заголовок вверху
- Nav items: иконка + label, `rounded-md` hover, active `bg-primary/10 text-primary`
- Текущая страница определяется через `usePathname()` (Next.js)

### Page header

- `flex items-center justify-between mb-6`
- Заголовок `text-xl font-semibold` + action buttons справа

---

## Экранные решения

> Раздел будет заполняться по мере реализации экранов.

### Login

- Centered card `max-w-sm mx-auto mt-24`
- `Card` + `CardHeader` (заголовок) + `CardContent` (форма) + `CardFooter` (кнопка)
- Поля: «Логин» (не email) + «Пароль»
- Кнопка `Button type="submit" className="w-full"`

---

## История изменений

| Версия | Дата | Изменение |
|---|---|---|
| 2.2 | 2026-04-19 | Добавлены паттерны: PasswordModal, ParticipantFormModal, ExcelImportModal, ParticipantsTable |
| 2.0 | 2026-04-14 | Миграция с custom CSS vars на shadcn/ui tokens + Tailwind v4 |
| 1.x | 2025–2026 | v1 (React 18 + Vite) — см. KPI-System-1 репозиторий |
