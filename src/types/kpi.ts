/**
 * KPI ViewModel types — used by components.
 * Components receive these types, never raw DB rows.
 *
 * Stage 1 stub — full types in Stage 3.
 */

import type { KpiCardStatus, UserRole } from "@/lib/constants";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  position?: string;
  department?: string;
}

export interface KpiCard {
  id: string;
  title: string;
  period: string;
  status: KpiCardStatus;
  participantId: string;
  participantName: string;
  createdAt: string;
  updatedAt: string;
}

export interface KpiLine {
  id: string;
  cardId: string;
  name: string;
  weight: number;
  target: number;
  actual?: number;
  unit: string;
}
