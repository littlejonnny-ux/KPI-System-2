/** Application-wide constants. */

export const APP_NAME = "KPI System";
export const APP_DESCRIPTION = "Система управления KPI-картами";

/** KPI card statuses */
export const KPI_CARD_STATUS = {
  DRAFT: "draft",
  PENDING_APPROVAL: "pending_approval",
  APPROVED: "approved",
  REJECTED: "rejected",
  ARCHIVED: "archived",
} as const;

export type KpiCardStatus = (typeof KPI_CARD_STATUS)[keyof typeof KPI_CARD_STATUS];

/** User roles */
export const USER_ROLE = {
  ADMIN: "admin",
  APPROVER: "approver",
  PARTICIPANT: "participant",
} as const;

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];

/** Pagination defaults */
export const PAGE_SIZE = 20;

/** KPI weight constraints */
export const KPI_WEIGHT_MIN = 5;
export const KPI_WEIGHT_MAX = 100;
export const KPI_WEIGHTS_SUM = 100;
