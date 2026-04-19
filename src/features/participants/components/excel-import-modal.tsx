"use client";

import { useState, useRef, useCallback } from "react";
import { generateTempPassword } from "../utils/generate-password";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, X } from "lucide-react";
import type { ImportResult } from "../hooks/use-participants";

// ---------------------------------------------------------------------------
// Row validation schema (mirrors API schema)
// ---------------------------------------------------------------------------

const rowSchema = z.object({
  workEmail: z.string().email("Некорректный email").max(254),
  firstName: z.string().min(1, "Обязательное поле").max(100),
  lastName: z.string().min(1, "Обязательное поле").max(100),
  middleName: z.string().optional(),
  systemRole: z.enum(["admin", "approver", "participant"]).default("participant"),
  baseSalary: z.coerce.number().positive().nullable().optional(),
  salaryMultiplier: z.coerce.number().positive().nullable().optional(),
});

type ParsedRow = z.output<typeof rowSchema> & { _rowIndex: number };

interface RowError {
  row: number;
  email: string;
  reason: string;
}

interface ExcelImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (rows: z.output<typeof rowSchema>[], defaultPassword: string) => void;
  isLoading?: boolean;
  importResult?: ImportResult | null;
}

// ---------------------------------------------------------------------------
// Column mapping from Excel header → schema field
// ---------------------------------------------------------------------------

const COLUMN_MAP: Record<string, string> = {
  email: "workEmail",
  "work_email": "workEmail",
  "рабочий email": "workEmail",
  "эл. почта": "workEmail",
  имя: "firstName",
  "first_name": "firstName",
  фамилия: "lastName",
  "last_name": "lastName",
  отчество: "middleName",
  "middle_name": "middleName",
  роль: "systemRole",
  "system_role": "systemRole",
  "базовая зарплата": "baseSalary",
  "base_salary": "baseSalary",
  "мультипликатор": "salaryMultiplier",
  "salary_multiplier": "salaryMultiplier",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ExcelImportModal({
  open,
  onClose,
  onImport,
  isLoading,
  importResult,
}: ExcelImportModalProps) {
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [parseErrors, setParseErrors] = useState<RowError[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setParsedRows([]);
    setParseErrors([]);
    setFileName(null);
  }

  async function parseFile(file: File) {
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      setParseErrors([{ row: 0, email: "", reason: "Поддерживаются только .xlsx и .xls файлы" }]);
      return;
    }

    try {
      // Dynamic import so the module is only loaded when needed (after user approves xlsx install)
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: null,
      });

      if (rawRows.length > 500) {
        setParseErrors([
          { row: 0, email: "", reason: `Максимум 500 строк. В файле: ${rawRows.length}` },
        ]);
        return;
      }

      const rows: ParsedRow[] = [];
      const errors: RowError[] = [];

      rawRows.forEach((raw, idx) => {
        // Normalize header keys
        const normalized: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(raw)) {
          const mapped = COLUMN_MAP[key.toLowerCase().trim()];
          if (mapped) normalized[mapped] = value;
        }

        if (!normalized["workEmail"]) {
          errors.push({ row: idx + 2, email: "", reason: "Отсутствует поле email" });
          return;
        }

        const result = rowSchema.safeParse(normalized);
        if (!result.success) {
          errors.push({
            row: idx + 2,
            email: String(normalized["workEmail"] ?? ""),
            reason: result.error.issues.map((i) => i.message).join("; "),
          });
          return;
        }

        rows.push({ ...result.data, _rowIndex: idx + 2 });
      });

      setParsedRows(rows);
      setParseErrors(errors);
      setFileName(file.name);
    } catch (err) {
      setParseErrors([
        { row: 0, email: "", reason: `Ошибка разбора файла: ${err instanceof Error ? err.message : String(err)}` },
      ]);
    }
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) void parseFile(file);
    },
    [],
  );

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void parseFile(file);
    e.target.value = "";
  }

  function handleImport() {
    if (parsedRows.length === 0) return;
    const password = generateTempPassword(12);
    onImport(parsedRows, password);
  }

  const hasValidRows = parsedRows.length > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-2xl" data-testid="excel-import-modal">
        <DialogHeader>
          <DialogTitle>Импорт участников из Excel</DialogTitle>
          <DialogDescription>
            Поддерживаемые форматы: .xlsx, .xls. Максимум 500 строк. Обязательные столбцы:{" "}
            <code>email</code>, <code>имя</code>, <code>фамилия</code>.
          </DialogDescription>
        </DialogHeader>

        {/* Import result */}
        {importResult && (
          <div className="rounded-md border p-4 space-y-1" data-testid="import-result">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <span>Создано: {importResult.created}</span>
              <span className="text-muted-foreground">Пропущено: {importResult.skipped}</span>
            </div>
            {importResult.errors.length > 0 && (
              <ul className="mt-2 space-y-1 text-xs text-destructive">
                {importResult.errors.slice(0, 10).map((e, i) => (
                  <li key={i}>{e.email}: {e.reason}</li>
                ))}
                {importResult.errors.length > 10 && (
                  <li>…и ещё {importResult.errors.length - 10} ошибок</li>
                )}
              </ul>
            )}
          </div>
        )}

        {/* Drop zone */}
        {!fileName && (
          <div
            className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors ${
              isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/30"
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            data-testid="excel-drop-zone"
          >
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Перетащите файл или{" "}
              <button
                type="button"
                className="text-primary underline underline-offset-2"
                onClick={() => inputRef.current?.click()}
                data-testid="excel-browse-btn"
              >
                выберите файл
              </button>
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
              data-testid="excel-file-input"
            />
          </div>
        )}

        {/* File preview */}
        {fileName && (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-green-400" />
                <span className="text-sm font-medium">{fileName}</span>
                {hasValidRows && (
                  <Badge className="bg-green-500/20 text-green-400">
                    {parsedRows.length} строк
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={reset}
                data-testid="excel-remove-file-btn"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {parseErrors.length > 0 && (
              <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 space-y-1" data-testid="excel-parse-errors">
                <div className="flex items-center gap-1 text-xs font-medium text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  <span>Ошибки ({parseErrors.length})</span>
                </div>
                <ul className="space-y-0.5 text-xs text-muted-foreground">
                  {parseErrors.slice(0, 5).map((e, i) => (
                    <li key={i}>
                      {e.row > 0 ? `Строка ${e.row}: ` : ""}
                      {e.email ? `${e.email} — ` : ""}
                      {e.reason}
                    </li>
                  ))}
                  {parseErrors.length > 5 && (
                    <li>…и ещё {parseErrors.length - 5} ошибок</li>
                  )}
                </ul>
              </div>
            )}

            {/* Preview table */}
            {hasValidRows && (
              <div className="rounded-md border overflow-hidden">
                <div className="max-h-48 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-muted">
                      <tr>
                        <th className="px-2 py-1 text-left font-medium">Email</th>
                        <th className="px-2 py-1 text-left font-medium">ФИО</th>
                        <th className="px-2 py-1 text-left font-medium">Роль</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.slice(0, 20).map((r, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-2 py-1">{r.workEmail}</td>
                          <td className="px-2 py-1">
                            {r.lastName} {r.firstName}
                          </td>
                          <td className="px-2 py-1">{r.systemRole}</td>
                        </tr>
                      ))}
                      {parsedRows.length > 20 && (
                        <tr className="border-t">
                          <td
                            colSpan={3}
                            className="px-2 py-1 text-center text-muted-foreground"
                          >
                            …и ещё {parsedRows.length - 20} строк
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => { reset(); onClose(); }}
            disabled={isLoading}
            data-testid="import-cancel-btn"
          >
            Отмена
          </Button>
          <Button
            type="button"
            disabled={!hasValidRows || isLoading}
            onClick={handleImport}
            data-testid="import-submit-btn"
          >
            {isLoading ? "Импортирование..." : `Импортировать (${parsedRows.length})`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
