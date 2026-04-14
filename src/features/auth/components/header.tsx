import { Badge } from "@/components/ui/badge";
import type { SystemRole } from "@/types/kpi";

const ROLE_LABELS: Record<SystemRole, string> = {
  admin: "Администратор",
  approver: "Согласующий",
  participant: "Участник",
};

interface HeaderProps {
  userName: string;
  role: SystemRole;
}

export function Header({ userName, role }: HeaderProps) {
  return (
    <header className="flex h-14 items-center justify-end border-b border-border bg-card px-6 gap-3">
      <span className="text-sm text-muted-foreground">{userName}</span>
      <Badge variant="outline" className="text-xs">
        {ROLE_LABELS[role]}
      </Badge>
    </header>
  );
}
