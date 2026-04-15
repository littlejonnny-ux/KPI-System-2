import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "./query-keys";
import type { KpiEvent, EventType } from "@/types/kpi";

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface EventsFilters {
  eventType?: EventType;
  relatedCardId?: string;
  limit?: number;
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapEvent(row: {
  id: string;
  event_type: EventType;
  title: string;
  description: string | null;
  related_card_id: string | null;
  created_by: string | null;
  created_at: string;
}): KpiEvent {
  return {
    id: row.id,
    eventType: row.event_type,
    title: row.title,
    description: row.description,
    relatedCardId: row.related_card_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

async function fetchEvents(filters: EventsFilters): Promise<KpiEvent[]> {
  const supabase = createClient();
  let query = supabase
    .from("events")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters.eventType) {
    query = query.eq("event_type", filters.eventType);
  }
  if (filters.relatedCardId) {
    query = query.eq("related_card_id", filters.relatedCardId);
  }
  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapEvent);
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useEvents(filters: EventsFilters = {}) {
  return useQuery({
    queryKey: queryKeys.events.list(filters),
    queryFn: () => fetchEvents(filters),
  });
}
