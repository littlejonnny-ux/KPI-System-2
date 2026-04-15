import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/features/shared/hooks/query-keys";
import type { Tables, TablesUpdate } from "@/types/database";
import type { UserProfile, SystemRole } from "@/types/kpi";

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface ParticipantsFilters {
  systemRole?: SystemRole;
  isActive?: boolean;
  approverId?: string;
  search?: string;
}

export interface CreateParticipantInput {
  workEmail: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  systemRole: SystemRole;
  approverId?: string | null;
  baseSalary?: number | null;
  salaryMultiplier?: number | null;
  levelValueId?: string | null;
  companyRoleId?: string | null;
  password: string;
}

export interface UpdateParticipantInput {
  id: string;
  firstName?: string;
  lastName?: string;
  middleName?: string | null;
  systemRole?: SystemRole;
  approverId?: string | null;
  baseSalary?: number | null;
  salaryMultiplier?: number | null;
  levelValueId?: string | null;
  companyRoleId?: string | null;
  isActive?: boolean;
}

export interface ResetPasswordInput {
  userId: string;
  workEmail: string;
}

export interface ImportParticipantsInput {
  participants: Omit<CreateParticipantInput, "password">[];
  defaultPassword: string;
}

export interface ImportResult {
  created: number;
  skipped: number;
  errors: Array<{ email: string; reason: string }>;
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapUserProfile(row: Tables<"users">): UserProfile {
  return {
    id: row.id,
    workEmail: row.work_email,
    firstName: row.first_name,
    lastName: row.last_name,
    middleName: row.middle_name,
    fullName: row.full_name,
    systemRole: row.system_role,
    isActive: row.is_active,
    approverId: row.approver_id,
    baseSalary: row.base_salary,
    salaryMultiplier: row.salary_multiplier,
    levelValueId: row.level_value_id,
    companyRoleId: row.company_role_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

async function fetchParticipants(filters: ParticipantsFilters): Promise<UserProfile[]> {
  const supabase = createClient();
  let query = supabase
    .from("users")
    .select("*")
    .order("last_name", { ascending: true });

  if (filters.systemRole) {
    query = query.eq("system_role", filters.systemRole);
  }
  if (filters.isActive !== undefined) {
    query = query.eq("is_active", filters.isActive);
  }
  if (filters.approverId) {
    query = query.eq("approver_id", filters.approverId);
  }
  if (filters.search) {
    query = query.or(
      `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,work_email.ilike.%${filters.search}%`,
    );
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapUserProfile);
}

// ---------------------------------------------------------------------------
// Mutation helpers
// ---------------------------------------------------------------------------

async function createParticipant(input: CreateParticipantInput): Promise<{ id: string }> {
  const response = await fetch("/api/participants/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to create participant");
  }

  const result = (await response.json()) as { id: string };
  return result;
}

async function updateParticipant(input: UpdateParticipantInput): Promise<void> {
  const supabase = createClient();
  const updateData: Partial<TablesUpdate<"users">> = {};

  if (input.firstName !== undefined) updateData.first_name = input.firstName;
  if (input.lastName !== undefined) updateData.last_name = input.lastName;
  if (input.middleName !== undefined) updateData.middle_name = input.middleName;
  if (input.systemRole !== undefined) updateData.system_role = input.systemRole;
  if (input.approverId !== undefined)
    updateData.approver_id = input.approverId ?? null;
  if (input.baseSalary !== undefined)
    updateData.base_salary = input.baseSalary ?? null;
  if (input.salaryMultiplier !== undefined)
    updateData.salary_multiplier = input.salaryMultiplier ?? null;
  if (input.levelValueId !== undefined)
    updateData.level_value_id = input.levelValueId ?? null;
  if (input.companyRoleId !== undefined)
    updateData.company_role_id = input.companyRoleId ?? null;
  if (input.isActive !== undefined) updateData.is_active = input.isActive;

  updateData.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from("users")
    .update(updateData)
    .eq("id", input.id);

  if (error) throw new Error(error.message);
}

async function resetPassword(input: ResetPasswordInput): Promise<void> {
  const response = await fetch("/api/participants/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: input.userId, workEmail: input.workEmail }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to reset password");
  }
}

async function importParticipants(input: ImportParticipantsInput): Promise<ImportResult> {
  const response = await fetch("/api/participants/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to import participants");
  }

  return response.json() as Promise<ImportResult>;
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useParticipants(filters: ParticipantsFilters = {}) {
  return useQuery({
    queryKey: queryKeys.participants.list(filters),
    queryFn: () => fetchParticipants(filters),
  });
}

export function useCreateParticipant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createParticipant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.participants.all });
    },
  });
}

export function useUpdateParticipant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateParticipant,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.participants.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.participants.detail(variables.id),
      });
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: resetPassword,
  });
}

export function useImportParticipants() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: importParticipants,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.participants.all });
    },
  });
}
