"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { InboxIcon, SearchIcon, TrendingUpIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold">{label}</h2>
        <Separator className="flex-1" />
      </div>
      {children}
    </section>
  );
}

// ─── Sample data ──────────────────────────────────────────────────────────────

const chartData = [
  { month: "Янв", plan: 80, fact: 72 },
  { month: "Фев", plan: 80, fact: 85 },
  { month: "Мар", plan: 85, fact: 90 },
  { month: "Апр", plan: 85, fact: 78 },
  { month: "Май", plan: 90, fact: 95 },
  { month: "Июн", plan: 90, fact: 88 },
];

const kpiRows = [
  { name: "Рост портфеля", weight: 30, target: "10 млрд ₽", actual: "9.8 млрд ₽", pct: 98, status: "approved" },
  { name: "NPS клиентов", weight: 20, target: "72", actual: "74", pct: 103, status: "approved" },
  { name: "Просрочка (NPL)", weight: 25, target: "≤ 4%", actual: "3.8%", pct: 105, status: "pending_approval" },
  { name: "Операционная прибыль", weight: 25, target: "1.2 млрд ₽", actual: "—", pct: 0, status: "draft" },
];

const STATUS_LABELS: Record<string, string> = {
  draft: "Черновик",
  pending_approval: "На согласовании",
  approved: "Утверждено",
  rejected: "Отклонено",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "outline",
  pending_approval: "secondary",
  approved: "default",
  rejected: "destructive",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DesignPage() {
  const [switchOn, setSwitchOn] = useState(false);
  const [checked, setChecked] = useState(false);

  return (
    <div className="mx-auto max-w-4xl space-y-16 px-6 py-12">
      {/* Page header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Design System</h1>
        <p className="text-muted-foreground">
          UI-компоненты и паттерны проекта KPI System v2
        </p>
      </div>

      {/* ── 8.1 Typography & Palette ───────────────────────────────────────── */}
      <Section id="typography" label="8.1 Типографика и палитра">
        <div className="space-y-6">
          <div className="space-y-1">
            <p className="text-xs font-mono text-muted-foreground">Geologica — основной шрифт</p>
            <p className="text-4xl font-light">Управление KPI-картами</p>
            <p className="text-2xl font-semibold">Управление KPI-картами</p>
            <p className="text-base font-normal">
              Система управления индивидуальными KPI-картами сотрудников уровней CEO-1 и CEO-2
              микрофинансовой компании с активами 10 млрд руб.
            </p>
            <p className="text-sm text-muted-foreground">
              Мелкий текст — описания, подсказки, метки полей
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-mono text-muted-foreground">JetBrains Mono — числа и коды</p>
            <p className="font-mono text-2xl">9 873 412 600 ₽</p>
            <p className="font-mono text-sm">KPI-2024-Q3-042 · 98.4% · 1 234 567</p>
          </div>

          {/* Color swatches */}
          <div className="space-y-2">
            <p className="text-xs font-mono text-muted-foreground">CSS-токены — тёмная тема</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: "--background", className: "bg-background border border-border" },
                { label: "--card", className: "bg-card border border-border" },
                { label: "--primary", className: "bg-primary" },
                { label: "--muted", className: "bg-muted" },
                { label: "--destructive", className: "bg-destructive" },
                { label: "--border", className: "bg-border" },
                { label: "--foreground", className: "bg-foreground" },
                { label: "--muted-foreground", className: "bg-muted-foreground" },
              ].map(({ label, className }) => (
                <div key={label} className="space-y-1">
                  <div className={`h-10 w-full rounded-lg ${className}`} />
                  <p className="font-mono text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ── 8.2 Buttons ───────────────────────────────────────────────────────── */}
      <Section id="buttons" label="8.2 Кнопки">
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs text-muted-foreground">Варианты</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="default">Сохранить</Button>
              <Button variant="secondary">Отмена</Button>
              <Button variant="outline">Редактировать</Button>
              <Button variant="ghost">Подробнее</Button>
              <Button variant="destructive">Удалить</Button>
              <Button variant="link">Ссылка</Button>
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs text-muted-foreground">Размеры</p>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="xs">XS</Button>
              <Button size="sm">SM</Button>
              <Button size="default">Default</Button>
              <Button size="lg">LG</Button>
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs text-muted-foreground">Иконки</p>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="icon-xs" variant="outline">
                <SearchIcon />
              </Button>
              <Button size="icon-sm" variant="outline">
                <SearchIcon />
              </Button>
              <Button size="icon">
                <TrendingUpIcon />
              </Button>
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs text-muted-foreground">Disabled</p>
            <div className="flex flex-wrap gap-2">
              <Button disabled>Сохранить</Button>
              <Button disabled variant="outline">
                Редактировать
              </Button>
            </div>
          </div>
        </div>
      </Section>

      {/* ── 8.3 Forms ─────────────────────────────────────────────────────────── */}
      <Section id="forms" label="8.3 Формы">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name-input">Имя сотрудника</Label>
              <Input id="name-input" placeholder="Иванов Иван Иванович" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="position-input">Должность</Label>
              <Input id="position-input" placeholder="Директор по финансам" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="comment-input">Комментарий</Label>
              <Textarea id="comment-input" placeholder="Введите комментарий..." rows={3} />
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="disabled-input">Заблокированное поле</Label>
              <Input id="disabled-input" disabled value="Только чтение" />
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                id="agree-checkbox"
                checked={checked}
                onCheckedChange={(v) => setChecked(v === true)}
              />
              <Label htmlFor="agree-checkbox">Подтверждаю корректность данных</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="notify-switch"
                checked={switchOn}
                onCheckedChange={setSwitchOn}
              />
              <Label htmlFor="notify-switch">
                Уведомления {switchOn ? "включены" : "выключены"}
              </Label>
            </div>
          </div>
        </div>
      </Section>

      {/* ── 8.4 Cards ─────────────────────────────────────────────────────────── */}
      <Section id="cards" label="8.4 Карточки">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>KPI-карта Q3 2024</CardTitle>
              <CardDescription>Иванов И.И. · CFO</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-2xl font-semibold">87.4%</p>
              <p className="text-sm text-muted-foreground">общий балл</p>
            </CardContent>
            <CardFooter>
              <Badge variant="default">Утверждено</Badge>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>KPI-карта Q3 2024</CardTitle>
              <CardDescription>Петров П.П. · COO</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-2xl font-semibold">—</p>
              <p className="text-sm text-muted-foreground">ожидает факта</p>
            </CardContent>
            <CardFooter>
              <Badge variant="secondary">На согласовании</Badge>
            </CardFooter>
          </Card>

          <Card size="sm">
            <CardHeader>
              <CardTitle>Итого вознаграждение</CardTitle>
              <CardDescription>Q3 2024 · все участники</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-xl font-semibold">4 820 000 ₽</p>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* ── 8.5 Tables ────────────────────────────────────────────────────────── */}
      <Section id="tables" label="8.5 Таблицы">
        <Card>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Показатель</TableHead>
                  <TableHead className="text-right">Вес</TableHead>
                  <TableHead>Цель</TableHead>
                  <TableHead>Факт</TableHead>
                  <TableHead className="text-right">Выполнение</TableHead>
                  <TableHead>Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kpiRows.map((row) => (
                  <TableRow key={row.name}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="text-right font-mono">{row.weight}%</TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      {row.target}
                    </TableCell>
                    <TableCell className="font-mono">{row.actual}</TableCell>
                    <TableCell className="text-right">
                      {row.pct > 0 ? (
                        <span
                          className={`font-mono font-medium ${
                            row.pct >= 100 ? "text-primary" : "text-foreground"
                          }`}
                        >
                          {row.pct}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[row.status]}>
                        {STATUS_LABELS[row.status]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Section>

      {/* ── 8.6 Badges ────────────────────────────────────────────────────────── */}
      <Section id="badges" label="8.6 Метки (Badge)">
        <div className="flex flex-wrap gap-2">
          <Badge variant="default">Утверждено</Badge>
          <Badge variant="secondary">На согласовании</Badge>
          <Badge variant="outline">Черновик</Badge>
          <Badge variant="destructive">Отклонено</Badge>
          <Badge variant="ghost">Архив</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="default">CEO-1</Badge>
          <Badge variant="secondary">CEO-2</Badge>
          <Badge variant="outline">Q1 2024</Badge>
          <Badge variant="outline">Q2 2024</Badge>
          <Badge variant="outline">Q3 2024</Badge>
        </div>
      </Section>

      {/* ── 8.7 Modal / Dialog ────────────────────────────────────────────────── */}
      <Section id="modal" label="8.7 Модальное окно">
        <div className="flex flex-wrap gap-3">
          <Dialog>
            <DialogTrigger render={<Button variant="outline" />}>
              Открыть диалог
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Согласование KPI-карты</DialogTitle>
                <DialogDescription>
                  Вы подтверждаете согласование KPI-карты Иванов И.И. за Q3 2024?
                  После согласования изменение данных будет недоступно.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter showCloseButton>
                <Button>Согласовать</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger render={<Button variant="destructive" />}>
              Диалог удаления
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Отклонить карту?</DialogTitle>
                <DialogDescription>
                  KPI-карта будет возвращена на доработку. Участник получит уведомление.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter showCloseButton>
                <Button variant="destructive">Отклонить</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </Section>

      {/* ── 8.8 Progress ──────────────────────────────────────────────────────── */}
      <Section id="progress" label="8.8 Прогресс-бары">
        <div className="space-y-4">
          {[
            { label: "Рост портфеля", value: 98 },
            { label: "NPS клиентов", value: 103 },
            { label: "Операционная прибыль", value: 72 },
            { label: "Просрочка (NPL)", value: 105 },
          ].map(({ label, value }) => (
            <Progress key={label} value={Math.min(value, 100)}>
              <ProgressLabel>{label}</ProgressLabel>
              <ProgressValue>{() => `${value}%`}</ProgressValue>
            </Progress>
          ))}
        </div>
      </Section>

      {/* ── 8.9 Empty state ───────────────────────────────────────────────────── */}
      <Section id="empty" label="8.9 Пустое состояние">
        <Tabs defaultValue="no-data">
          <TabsList>
            <TabsTrigger value="no-data">Нет данных</TabsTrigger>
            <TabsTrigger value="no-results">Нет результатов</TabsTrigger>
          </TabsList>
          <TabsContent value="no-data">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <InboxIcon className="mb-4 size-12 text-muted-foreground/40" />
                <p className="font-medium">KPI-карты не созданы</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Создайте первую карту для участника, чтобы начать работу
                </p>
                <Button className="mt-4">Создать карту</Button>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="no-results">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <SearchIcon className="mb-4 size-12 text-muted-foreground/40" />
                <p className="font-medium">Ничего не найдено</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  По вашему запросу нет совпадений. Попробуйте изменить фильтры.
                </p>
                <Button variant="outline" className="mt-4">
                  Сбросить фильтры
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Section>

      {/* ── 8.10 Sidebar pattern ──────────────────────────────────────────────── */}
      <Section id="sidebar" label="8.10 Боковая панель (паттерн)">
        <Card>
          <CardContent className="p-0">
            <div className="flex overflow-hidden rounded-xl">
              {/* Sidebar mock */}
              <div className="w-56 shrink-0 border-r border-border bg-card p-4 space-y-1">
                {[
                  "Дашборд",
                  "KPI-карты",
                  "Библиотека KPI",
                  "Участники",
                  "Запускающие цели",
                  "Согласование",
                  "Архив",
                ].map((item, i) => (
                  <div
                    key={item}
                    className={`flex h-8 cursor-pointer items-center rounded-lg px-3 text-sm transition-colors ${
                      i === 1
                        ? "bg-primary/15 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {item}
                  </div>
                ))}
              </div>
              {/* Content area */}
              <div className="flex-1 p-6">
                <p className="font-medium">KPI-карты</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Активный раздел подсвечен в боковой панели
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* ── 8.11 Breadcrumb ───────────────────────────────────────────────────── */}
      <Section id="breadcrumb" label="8.11 Хлебные крошки">
        <Card>
          <CardContent className="py-4">
            <nav aria-label="Breadcrumb">
              <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
                {["Дашборд", "KPI-карты", "Иванов И.И.", "Q3 2024"].map((crumb, i, arr) => (
                  <li key={crumb} className="flex items-center gap-1.5">
                    {i < arr.length - 1 ? (
                      <>
                        <span className="cursor-pointer hover:text-foreground transition-colors">
                          {crumb}
                        </span>
                        <span>/</span>
                      </>
                    ) : (
                      <span className="font-medium text-foreground">{crumb}</span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          </CardContent>
        </Card>
      </Section>

      {/* ── 8.12 Reward formula ───────────────────────────────────────────────── */}
      <Section id="formula" label="8.12 Формула вознаграждения">
        <Card>
          <CardHeader>
            <CardTitle>Расчёт вознаграждения</CardTitle>
            <CardDescription>
              Пример: оклад 500 000 ₽, квартальный бонус = оклад × коэффициент
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Formula display */}
            <div className="rounded-lg bg-muted/50 px-4 py-3 font-mono text-sm">
              <span className="text-muted-foreground">Бонус = </span>
              <span>Оклад × Целевой% × (Σ Вес</span>
              <sub>i</sub>
              <span> × Балл</span>
              <sub>i</sub>
              <span>) / 100</span>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "Оклад", value: "500 000 ₽" },
                { label: "Целевой бонус %", value: "25%" },
                { label: "Итоговый балл", value: "87.4%" },
                { label: "Бонус к выплате", value: "109 250 ₽" },
              ].map(({ label, value }) => (
                <div key={label} className="space-y-1">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="font-mono text-base font-semibold">{value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* ── 8.13 Charts ───────────────────────────────────────────────────────── */}
      <Section id="charts" label="8.13 Графики (recharts)">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Bar chart */}
          <Card>
            <CardHeader>
              <CardTitle>Выполнение по показателям</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={kpiRows.filter((r) => r.pct > 0)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.26 0.045 258)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "oklch(0.55 0.02 258)" }}
                    tickLine={false}
                    axisLine={false}
                    width={60}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "oklch(0.55 0.02 258)" }}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 120]}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.155 0.025 258)",
                      border: "1px solid oklch(0.26 0.045 258)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v) => [`${v}%`, "Факт/план"]}
                  />
                  <Bar dataKey="pct" fill="oklch(0.55 0.165 258)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Line chart */}
          <Card>
            <CardHeader>
              <CardTitle>Динамика план/факт</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.26 0.045 258)" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "oklch(0.55 0.02 258)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "oklch(0.55 0.02 258)" }}
                    tickLine={false}
                    axisLine={false}
                    domain={[60, 110]}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.155 0.025 258)",
                      border: "1px solid oklch(0.26 0.045 258)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v, name) => [
                      `${v}%`,
                      name === "plan" ? "План" : "Факт",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="plan"
                    stroke="oklch(0.55 0.02 258)"
                    strokeDasharray="4 2"
                    strokeWidth={1.5}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="fact"
                    stroke="oklch(0.55 0.165 258)"
                    strokeWidth={2}
                    dot={{ fill: "oklch(0.55 0.165 258)", r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </Section>
    </div>
  );
}
