"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, FileSpreadsheet, Search } from "lucide-react";
import { ParticipantsTable } from "@/features/participants/components/participants-table";
import { ParticipantFormModal } from "@/features/participants/components/participant-form-modal";
import { ExcelImportModal } from "@/features/participants/components/excel-import-modal";
import { PasswordModal } from "@/features/participants/components/password-modal";
import {
  useParticipants,
  useCreateParticipant,
  useUpdateParticipant,
  useResetPassword,
  useImportParticipants,
} from "@/features/participants/hooks/use-participants";
import { generateTempPassword } from "@/features/participants/utils/generate-password";
import { ROLE_LABELS } from "@/lib/constants";
import type { UserProfile, SystemRole } from "@/types/kpi";
import type { ImportResult } from "@/features/participants/hooks/use-participants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ModalState =
  | { type: "none" }
  | { type: "create"; password: string }
  | { type: "edit"; participant: UserProfile }
  | { type: "password"; participant: UserProfile; password: string; mode: "created" | "reset" }
  | { type: "import" };

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ParticipantsPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<SystemRole | "all">("all");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("active");
  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const filters = useMemo(
    () => ({
      search: search || undefined,
      systemRole: roleFilter !== "all" ? roleFilter : undefined,
      isActive:
        activeFilter === "active" ? true : activeFilter === "inactive" ? false : undefined,
    }),
    [search, roleFilter, activeFilter],
  );

  const { data: participants = [], isLoading } = useParticipants(filters);
  const createMutation = useCreateParticipant();
  const updateMutation = useUpdateParticipant();
  const resetPasswordMutation = useResetPassword();
  const importMutation = useImportParticipants();

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  function openCreate() {
    const password = generateTempPassword();
    setModal({ type: "create", password });
  }

  function handleCreate(data: {
    firstName: string;
    lastName: string;
    middleName?: string;
    workEmail: string;
    systemRole: SystemRole;
    baseSalary?: number | null;
    salaryMultiplier?: number | null;
    password?: string;
  }) {
    if (modal.type !== "create") return;
    const password = modal.password;

    createMutation.mutate(
      {
        workEmail: data.workEmail,
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName ?? null,
        systemRole: data.systemRole,
        baseSalary: data.baseSalary ?? null,
        salaryMultiplier: data.salaryMultiplier ?? null,
        password,
      },
      {
        onSuccess: (_result) => {
          const tempParticipant: UserProfile = {
            id: "",
            workEmail: data.workEmail,
            firstName: data.firstName,
            lastName: data.lastName,
            middleName: data.middleName ?? null,
            fullName: null,
            systemRole: data.systemRole,
            isActive: true,
            approverId: null,
            baseSalary: data.baseSalary ?? null,
            salaryMultiplier: data.salaryMultiplier ?? null,
            levelValueId: null,
            companyRoleId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setModal({ type: "password", participant: tempParticipant, password, mode: "created" });
        },
      },
    );
  }

  function handleEdit(data: {
    firstName?: string;
    lastName?: string;
    middleName?: string;
    workEmail?: string;
    systemRole?: SystemRole;
    baseSalary?: number | null;
    salaryMultiplier?: number | null;
  }) {
    if (modal.type !== "edit") return;
    const { participant } = modal;

    updateMutation.mutate(
      {
        id: participant.id,
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName ?? null,
        systemRole: data.systemRole,
        baseSalary: data.baseSalary ?? null,
        salaryMultiplier: data.salaryMultiplier ?? null,
      },
      {
        onSuccess: () => setModal({ type: "none" }),
      },
    );
  }

  function handleResetPassword(participant: UserProfile) {
    const password = generateTempPassword();
    resetPasswordMutation.mutate(
      { userId: participant.id, workEmail: participant.workEmail, newPassword: password },
      {
        onSuccess: () => {
          setModal({ type: "password", participant, password, mode: "reset" });
        },
      },
    );
  }

  function handleToggleActive(participant: UserProfile) {
    updateMutation.mutate({ id: participant.id, isActive: !participant.isActive });
  }

  function handleImport(
    rows: Array<{
      workEmail: string;
      firstName: string;
      lastName: string;
      middleName?: string | null;
      systemRole?: SystemRole;
      baseSalary?: number | null;
      salaryMultiplier?: number | null;
    }>,
    defaultPassword: string,
  ) {
    importMutation.mutate(
      {
        participants: rows.map((r) => ({
          workEmail: r.workEmail,
          firstName: r.firstName,
          lastName: r.lastName,
          middleName: r.middleName ?? null,
          systemRole: (r.systemRole as SystemRole) ?? "participant",
          baseSalary: r.baseSalary ?? null,
          salaryMultiplier: r.salaryMultiplier ?? null,
        })),
        defaultPassword,
      },
      {
        onSuccess: (result) => {
          setImportResult(result);
        },
      },
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6" data-testid="participants-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Участники</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setModal({ type: "import" })}
            data-testid="import-excel-btn"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Импорт Excel
          </Button>
          <Button onClick={openCreate} data-testid="create-participant-btn">
            <UserPlus className="mr-2 h-4 w-4" />
            Создать участника
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3" data-testid="participants-filters">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск по имени или email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="search-input"
          />
        </div>
        <Select
          value={roleFilter}
          onValueChange={(v) => setRoleFilter(v as SystemRole | "all")}
        >
          <SelectTrigger className="w-44" data-testid="filter-role">
            <SelectValue placeholder="Все роли" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все роли</SelectItem>
            {(["participant", "approver", "admin"] as SystemRole[]).map((role) => (
              <SelectItem key={role} value={role}>
                {ROLE_LABELS[role]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={activeFilter}
          onValueChange={(v) => setActiveFilter(v as "all" | "active" | "inactive")}
        >
          <SelectTrigger className="w-40" data-testid="filter-active">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="active">Активные</SelectItem>
            <SelectItem value="inactive">Неактивные</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div
          className="flex h-40 items-center justify-center text-muted-foreground"
          data-testid="participants-loading"
        >
          Загрузка...
        </div>
      ) : (
        <ParticipantsTable
          participants={participants}
          onEdit={(p) => setModal({ type: "edit", participant: p })}
          onResetPassword={handleResetPassword}
          onToggleActive={handleToggleActive}
        />
      )}

      {/* Modals */}
      <ParticipantFormModal
        open={modal.type === "create"}
        onClose={() => setModal({ type: "none" })}
        mode="create"
        password={modal.type === "create" ? modal.password : ""}
        onSubmit={handleCreate as Parameters<typeof ParticipantFormModal>[0]["onSubmit"]}
        isLoading={createMutation.isPending}
      />

      <ParticipantFormModal
        open={modal.type === "edit"}
        onClose={() => setModal({ type: "none" })}
        mode="edit"
        participant={modal.type === "edit" ? modal.participant : undefined}
        onSubmit={handleEdit as Parameters<typeof ParticipantFormModal>[0]["onSubmit"]}
        isLoading={updateMutation.isPending}
      />

      <PasswordModal
        open={modal.type === "password"}
        onClose={() => setModal({ type: "none" })}
        password={modal.type === "password" ? modal.password : ""}
        participantEmail={modal.type === "password" ? modal.participant.workEmail : ""}
        mode={modal.type === "password" ? modal.mode : "created"}
      />

      <ExcelImportModal
        open={modal.type === "import"}
        onClose={() => { setModal({ type: "none" }); setImportResult(null); }}
        onImport={handleImport}
        isLoading={importMutation.isPending}
        importResult={importResult}
      />
    </div>
  );
}
