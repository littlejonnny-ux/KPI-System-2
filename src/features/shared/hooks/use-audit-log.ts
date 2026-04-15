import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "./query-keys";
import type { AuditLogEntry, AuditAction } from "@/types/kpi";

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapAuditEntry(row: {
  id: string;
  entity_type: string;
  entity_id: string;
  action: AuditAction;
  new_value: unknown | null;
  comment: string | null;
  performed_by: string | null;
  performed_at: string;
}): AuditLogEntry {
  return {
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    action: row.action,
    newValue: row.new_value,
    comment: row.comment,
    performedBy: row.performed_by,
    performedAt: row.performed_at,
  };
}

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

async function fetchAuditLog(
  entityType: string,
  entityId: string,
): Promise<AuditLogEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("audit_log")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("performed_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapAuditEntry);
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useAuditLog(
  entityType: string | undefined,
  entityId: string | undefined,
) {
  return useQuery({
    queryKey: queryKeys.auditLog.entity(entityType ?? "", entityId ?? ""),
    queryFn: () => fetchAuditLog(entityType!, entityId!),
    enabled: Boolean(entityType) && Boolean(entityId),
  });
}
