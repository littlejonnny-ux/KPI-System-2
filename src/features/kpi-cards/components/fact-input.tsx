"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EvaluationMethod, CardLineDiscretePoint } from "@/types/kpi";

interface FactInputProps {
  method: EvaluationMethod;
  value: number | null;
  onChange: (value: number | null) => void;
  disabled?: boolean;
  discretePoints?: CardLineDiscretePoint[];
}

export function FactInput({
  method,
  value,
  onChange,
  disabled = false,
  discretePoints = [],
}: FactInputProps) {
  if (method === "binary") {
    return (
      <Select
        value={value !== null ? String(value) : ""}
        onValueChange={(v) => onChange(v === "" ? null : Number(v))}
        disabled={disabled}
      >
        <SelectTrigger className="w-28" data-testid="fact-input-binary">
          <SelectValue placeholder="—" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Да</SelectItem>
          <SelectItem value="0">Нет</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  if (method === "discrete") {
    return (
      <Input
        type="number"
        step="1"
        value={value !== null ? String(value) : ""}
        onChange={(e) =>
          onChange(e.target.value === "" ? null : Math.trunc(Number(e.target.value)))
        }
        disabled={disabled}
        className="w-28"
        placeholder="—"
        list={discretePoints.length > 0 ? "discrete-options" : undefined}
        data-testid="fact-input-discrete"
      />
    );
  }

  if (method === "manual") {
    return (
      <div className="flex items-center gap-1">
        <Input
          type="number"
          min={0}
          max={100}
          step={0.01}
          value={value !== null ? String(value) : ""}
          onChange={(e) =>
            onChange(e.target.value === "" ? null : Number(e.target.value))
          }
          disabled={disabled}
          className="w-24"
          placeholder="0"
          data-testid="fact-input-manual"
        />
        <span className="text-muted-foreground text-sm">%</span>
      </div>
    );
  }

  return (
    <Input
      type="number"
      step="any"
      value={value !== null ? String(value) : ""}
      onChange={(e) =>
        onChange(e.target.value === "" ? null : Number(e.target.value))
      }
      disabled={disabled}
      className="w-32"
      placeholder="—"
      data-testid="fact-input-scale"
    />
  );
}
