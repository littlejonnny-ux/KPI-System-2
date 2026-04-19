"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, KeyRound, UserX, UserCheck } from "lucide-react";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/constants";
import type { UserProfile } from "@/types/kpi";

interface ParticipantsTableProps {
  participants: UserProfile[];
  onEdit: (participant: UserProfile) => void;
  onResetPassword: (participant: UserProfile) => void;
  onToggleActive: (participant: UserProfile) => void;
}

export function ParticipantsTable({
  participants,
  onEdit,
  onResetPassword,
  onToggleActive,
}: ParticipantsTableProps) {
  if (participants.length === 0) {
    return (
      <div
        className="flex h-40 items-center justify-center rounded-md border border-dashed text-muted-foreground"
        data-testid="participants-empty"
      >
        Участники не найдены
      </div>
    );
  }

  return (
    <div className="rounded-md border" data-testid="participants-table">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ФИО</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Роль</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {participants.map((p) => (
            <TableRow
              key={p.id}
              className={p.isActive ? "" : "opacity-50"}
              data-testid={`participant-row-${p.id}`}
            >
              <TableCell className="font-medium">
                {p.lastName} {p.firstName}
                {p.middleName ? ` ${p.middleName}` : ""}
              </TableCell>
              <TableCell className="text-muted-foreground">{p.workEmail}</TableCell>
              <TableCell>
                <Badge className={ROLE_COLORS[p.systemRole] ?? ""}>
                  {ROLE_LABELS[p.systemRole] ?? p.systemRole}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  className={
                    p.isActive
                      ? "bg-green-500/20 text-green-400"
                      : "bg-muted text-muted-foreground"
                  }
                >
                  {p.isActive ? "Активен" : "Неактивен"}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    aria-label="Действия"
                    data-testid={`participant-actions-${p.id}`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => onEdit(p)}
                      data-testid={`action-edit-${p.id}`}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Редактировать
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onResetPassword(p)}
                      data-testid={`action-reset-password-${p.id}`}
                    >
                      <KeyRound className="mr-2 h-4 w-4" />
                      Сбросить пароль
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onToggleActive(p)}
                      data-testid={`action-toggle-active-${p.id}`}
                    >
                      {p.isActive ? (
                        <>
                          <UserX className="mr-2 h-4 w-4 text-destructive" />
                          <span className="text-destructive">Деактивировать</span>
                        </>
                      ) : (
                        <>
                          <UserCheck className="mr-2 h-4 w-4 text-green-400" />
                          <span className="text-green-400">Активировать</span>
                        </>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
