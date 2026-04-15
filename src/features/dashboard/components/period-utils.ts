import type { CardPeriodType } from "@/types/kpi";

export function formatPeriod(
  type: CardPeriodType,
  year: number,
  sub: string | null,
): string {
  switch (type) {
    case "Q1":
    case "Q2":
    case "Q3":
    case "Q4":
    case "H1":
    case "H2":
      return `${type} ${year}`;
    case "year":
      return `${year} (год)`;
    case "custom":
      return sub ? `${sub} ${year}` : `${year} (произвольно)`;
    default:
      return `${year}`;
  }
}
