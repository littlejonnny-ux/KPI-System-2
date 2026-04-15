/**
 * Centralized query key factory for all TanStack Query hooks.
 * Consistent keys enable precise cache invalidation across modules.
 */

export const queryKeys = {
  // KPI Cards
  kpiCards: {
    all: ["kpi-cards"] as const,
    lists: () => [...queryKeys.kpiCards.all, "list"] as const,
    list: (filters?: unknown) =>
      [...queryKeys.kpiCards.lists(), filters] as const,
    details: () => [...queryKeys.kpiCards.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.kpiCards.details(), id] as const,
  },

  // KPI Library
  kpiLibrary: {
    all: ["kpi-library"] as const,
    lists: () => [...queryKeys.kpiLibrary.all, "list"] as const,
    list: (filters?: unknown) =>
      [...queryKeys.kpiLibrary.lists(), filters] as const,
    details: () => [...queryKeys.kpiLibrary.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.kpiLibrary.details(), id] as const,
  },

  // Participants
  participants: {
    all: ["participants"] as const,
    lists: () => [...queryKeys.participants.all, "list"] as const,
    list: (filters?: unknown) =>
      [...queryKeys.participants.lists(), filters] as const,
    details: () => [...queryKeys.participants.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.participants.details(), id] as const,
  },

  // Trigger Goals
  triggerGoals: {
    all: ["trigger-goals"] as const,
    lists: () => [...queryKeys.triggerGoals.all, "list"] as const,
    list: (filters?: unknown) =>
      [...queryKeys.triggerGoals.lists(), filters] as const,
    details: () => [...queryKeys.triggerGoals.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.triggerGoals.details(), id] as const,
    userData: (cardId: string) =>
      [...queryKeys.triggerGoals.all, "user-data", cardId] as const,
  },

  // Shared
  dictionaries: {
    all: ["dictionaries"] as const,
    lists: () => [...queryKeys.dictionaries.all, "list"] as const,
    detail: (id: string) =>
      [...queryKeys.dictionaries.all, "detail", id] as const,
  },

  events: {
    all: ["events"] as const,
    lists: () => [...queryKeys.events.all, "list"] as const,
    list: (filters?: unknown) =>
      [...queryKeys.events.lists(), filters] as const,
  },

  auditLog: {
    all: ["audit-log"] as const,
    entity: (entityType: string, entityId: string) =>
      [...queryKeys.auditLog.all, entityType, entityId] as const,
  },
} as const;
