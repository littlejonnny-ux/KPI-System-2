"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAddLine } from "@/features/kpi-cards/hooks/use-card-mutations";
import { METHOD_LABELS, UNIT_OPTIONS } from "@/lib/constants";
import type { EvaluationMethod } from "@/types/kpi";

const METHODS: EvaluationMethod[] = ["scale", "binary", "discrete", "manual"];

interface AddLineModalProps {
  open: boolean;
  onClose: () => void;
  cardId: string;
}

interface FormState {
  name: string;
  unit: string;
  evaluationMethod: EvaluationMethod;
  weight: string;
  targetValue: string;
}

const INITIAL: FormState = {
  name: "",
  unit: "%",
  evaluationMethod: "scale",
  weight: "10",
  targetValue: "",
};

export function AddLineModal({ open, onClose, cardId }: AddLineModalProps) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [error, setError] = useState<string | null>(null);
  const mutation = useAddLine();

  function update(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }

  function handleClose() {
    setForm(INITIAL);
    setError(null);
    onClose();
  }

  function handleSubmit() {
    if (!form.name.trim()) {
      setError("Введите название показателя");
      return;
    }
    const weight = Number(form.weight);
    if (isNaN(weight) || weight < 5 || weight > 100) {
      setError("Вес должен быть от 5 до 100");
      return;
    }
    const targetValue =
      form.targetValue === "" ? null : Number(form.targetValue);
    if (form.targetValue !== "" && isNaN(Number(form.targetValue))) {
      setError("Некорректное плановое значение");
      return;
    }

    mutation.mutate(
      {
        cardId,
        name: form.name.trim(),
        unit: form.unit,
        evaluationMethod: form.evaluationMethod,
        weight,
        targetValue,
      },
      { onSuccess: handleClose }
    );
  }

  const needsTarget =
    form.evaluationMethod === "scale" || form.evaluationMethod === "manual";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Добавить показатель</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="line-name">Название</Label>
            <Input
              id="line-name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Название KPI-показателя"
              data-testid="line-name"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Единица</Label>
              <Select value={form.unit} onValueChange={(v) => update("unit", v ?? form.unit)}>
                <SelectTrigger data-testid="line-unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_OPTIONS.map((u) => (
                    <SelectItem key={u.value} value={u.value}>
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Метод</Label>
              <Select
                value={form.evaluationMethod}
                onValueChange={(v) => update("evaluationMethod", v as EvaluationMethod)}
              >
                <SelectTrigger data-testid="line-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METHODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {METHOD_LABELS[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="line-weight">Вес (%)</Label>
              <Input
                id="line-weight"
                type="number"
                min={5}
                max={100}
                value={form.weight}
                onChange={(e) => update("weight", e.target.value)}
                data-testid="line-weight"
              />
            </div>
            {needsTarget && (
              <div className="space-y-1">
                <Label htmlFor="line-target">Plan</Label>
                <Input
                  id="line-target"
                  type="number"
                  step="any"
                  value={form.targetValue}
                  onChange={(e) => update("targetValue", e.target.value)}
                  placeholder="—"
                  data-testid="line-target"
                />
              </div>
            )}
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={mutation.isPending}>
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={mutation.isPending}
            data-testid="add-line-submit"
          >
            Добавить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
