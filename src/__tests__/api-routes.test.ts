/**
 * Unit tests for Stage 6 API route helpers.
 *
 * Tests all exported pure functions from:
 *   - src/lib/api-auth.ts
 *   - src/app/api/cards/approve-line/route.ts
 *   - src/app/api/cards/return-line/route.ts
 *   - src/app/api/cards/submit/route.ts
 *   - src/app/api/reward/calculate/route.ts
 *
 * No DB or HTTP mocking needed — all tested functions are pure business logic.
 * ≥ 80% coverage of exported helpers.
 */

import { describe, it, expect } from "vitest";

// api-auth helpers
import {
  isAdmin,
  isApprover,
  isParticipant,
  canApproveOrReturn,
  type AuthenticatedUser,
} from "@/lib/api-auth";

// approve-line helpers
import {
  approveLineSchema,
  isCardApprovable,
} from "@/app/api/cards/approve-line/route";

// return-line helpers
import {
  returnLineSchema,
  isCardReturnable,
} from "@/app/api/cards/return-line/route";

// submit helpers
import {
  submitCardSchema,
  SUBMITTABLE_STATUSES,
  isCardSubmittable,
  canActorSubmitCard,
} from "@/app/api/cards/submit/route";

// reward calculate helpers
import {
  directParamsSchema,
  cardBasedSchema,
  buildRewardResult,
  participantCanViewCard,
} from "@/app/api/reward/calculate/route";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ADMIN_USER: AuthenticatedUser = {
  authId: "auth-admin",
  userId: "user-admin",
  systemRole: "admin",
  workEmail: "admin@example.com",
};

const APPROVER_USER: AuthenticatedUser = {
  authId: "auth-approver",
  userId: "user-approver",
  systemRole: "approver",
  workEmail: "approver@example.com",
};

const PARTICIPANT_USER: AuthenticatedUser = {
  authId: "auth-participant",
  userId: "user-participant",
  systemRole: "participant",
  workEmail: "participant@example.com",
};

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";
const OTHER_UUID = "661f9511-f3ac-52e5-b827-557766551111";

// ---------------------------------------------------------------------------
// api-auth: role helpers
// ---------------------------------------------------------------------------

describe("api-auth role helpers", () => {
  it("isAdmin — returns true only for admin", () => {
    expect(isAdmin(ADMIN_USER)).toBe(true);
    expect(isAdmin(APPROVER_USER)).toBe(false);
    expect(isAdmin(PARTICIPANT_USER)).toBe(false);
  });

  it("isApprover — returns true only for approver", () => {
    expect(isApprover(APPROVER_USER)).toBe(true);
    expect(isApprover(ADMIN_USER)).toBe(false);
    expect(isApprover(PARTICIPANT_USER)).toBe(false);
  });

  it("isParticipant — returns true only for participant", () => {
    expect(isParticipant(PARTICIPANT_USER)).toBe(true);
    expect(isParticipant(ADMIN_USER)).toBe(false);
    expect(isParticipant(APPROVER_USER)).toBe(false);
  });

  it("canApproveOrReturn — true for admin and approver, false for participant", () => {
    expect(canApproveOrReturn(ADMIN_USER)).toBe(true);
    expect(canApproveOrReturn(APPROVER_USER)).toBe(true);
    expect(canApproveOrReturn(PARTICIPANT_USER)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// approve-line: isCardApprovable
// ---------------------------------------------------------------------------

describe("isCardApprovable", () => {
  it("returns true for pending_approval", () => {
    expect(isCardApprovable("pending_approval")).toBe(true);
  });

  it("returns false for all other statuses", () => {
    for (const status of ["draft", "active", "approved", "returned"]) {
      expect(isCardApprovable(status)).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// approve-line: approveLineSchema
// ---------------------------------------------------------------------------

describe("approveLineSchema", () => {
  it("accepts valid input with comment", () => {
    const result = approveLineSchema.safeParse({
      lineId: VALID_UUID,
      cardId: OTHER_UUID,
      comment: "Looks good",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid input without comment", () => {
    const result = approveLineSchema.safeParse({
      lineId: VALID_UUID,
      cardId: OTHER_UUID,
    });
    expect(result.success).toBe(true);
  });

  it("accepts null comment", () => {
    const result = approveLineSchema.safeParse({
      lineId: VALID_UUID,
      cardId: OTHER_UUID,
      comment: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-UUID lineId", () => {
    const result = approveLineSchema.safeParse({
      lineId: "not-a-uuid",
      cardId: OTHER_UUID,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID cardId", () => {
    const result = approveLineSchema.safeParse({
      lineId: VALID_UUID,
      cardId: "bad",
    });
    expect(result.success).toBe(false);
  });

  it("rejects comment longer than 1000 chars", () => {
    const result = approveLineSchema.safeParse({
      lineId: VALID_UUID,
      cardId: OTHER_UUID,
      comment: "x".repeat(1001),
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// return-line: isCardReturnable
// ---------------------------------------------------------------------------

describe("isCardReturnable", () => {
  it("returns true for pending_approval", () => {
    expect(isCardReturnable("pending_approval")).toBe(true);
  });

  it("returns false for other statuses", () => {
    for (const status of ["draft", "active", "approved", "returned"]) {
      expect(isCardReturnable(status)).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// return-line: returnLineSchema
// ---------------------------------------------------------------------------

describe("returnLineSchema", () => {
  it("accepts valid input with comment", () => {
    const result = returnLineSchema.safeParse({
      lineId: VALID_UUID,
      cardId: OTHER_UUID,
      comment: "Needs revision",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty comment", () => {
    const result = returnLineSchema.safeParse({
      lineId: VALID_UUID,
      cardId: OTHER_UUID,
      comment: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing comment", () => {
    const result = returnLineSchema.safeParse({
      lineId: VALID_UUID,
      cardId: OTHER_UUID,
    });
    expect(result.success).toBe(false);
  });

  it("rejects comment longer than 1000 chars", () => {
    const result = returnLineSchema.safeParse({
      lineId: VALID_UUID,
      cardId: OTHER_UUID,
      comment: "a".repeat(1001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID lineId", () => {
    const result = returnLineSchema.safeParse({
      lineId: "nope",
      cardId: OTHER_UUID,
      comment: "Valid comment",
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// submit: SUBMITTABLE_STATUSES and isCardSubmittable
// ---------------------------------------------------------------------------

describe("SUBMITTABLE_STATUSES and isCardSubmittable", () => {
  it("SUBMITTABLE_STATUSES contains draft, active, returned", () => {
    expect(SUBMITTABLE_STATUSES).toContain("draft");
    expect(SUBMITTABLE_STATUSES).toContain("active");
    expect(SUBMITTABLE_STATUSES).toContain("returned");
  });

  it("isCardSubmittable — true for draft/active/returned", () => {
    expect(isCardSubmittable("draft")).toBe(true);
    expect(isCardSubmittable("active")).toBe(true);
    expect(isCardSubmittable("returned")).toBe(true);
  });

  it("isCardSubmittable — false for pending_approval and approved", () => {
    expect(isCardSubmittable("pending_approval")).toBe(false);
    expect(isCardSubmittable("approved")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// submit: submitCardSchema
// ---------------------------------------------------------------------------

describe("submitCardSchema", () => {
  it("accepts valid UUID cardId", () => {
    const result = submitCardSchema.safeParse({ cardId: VALID_UUID });
    expect(result.success).toBe(true);
  });

  it("rejects missing cardId", () => {
    const result = submitCardSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID cardId", () => {
    const result = submitCardSchema.safeParse({ cardId: "not-a-uuid" });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// submit: canActorSubmitCard
// ---------------------------------------------------------------------------

describe("canActorSubmitCard", () => {
  const OWNER_ID = "owner-uuid";
  const MANAGER_ID = "manager-uuid";
  const STRANGER_ID = "stranger-uuid";

  describe("admin", () => {
    it("can submit any card", () => {
      expect(canActorSubmitCard("admin", STRANGER_ID, OWNER_ID, MANAGER_ID)).toBe(true);
    });
  });

  describe("participant", () => {
    it("can submit own card", () => {
      expect(canActorSubmitCard("participant", OWNER_ID, OWNER_ID, MANAGER_ID)).toBe(true);
    });

    it("cannot submit another user's card", () => {
      expect(canActorSubmitCard("participant", STRANGER_ID, OWNER_ID, MANAGER_ID)).toBe(false);
    });
  });

  describe("approver", () => {
    it("can submit own card", () => {
      expect(canActorSubmitCard("approver", MANAGER_ID, MANAGER_ID, null)).toBe(true);
    });

    it("can submit subordinate's card (ownerApproverId === actorUserId)", () => {
      expect(canActorSubmitCard("approver", MANAGER_ID, OWNER_ID, MANAGER_ID)).toBe(true);
    });

    it("cannot submit card of a user with a different manager", () => {
      expect(canActorSubmitCard("approver", MANAGER_ID, OWNER_ID, STRANGER_ID)).toBe(false);
    });

    it("cannot submit card when ownerApproverId is null and not own card", () => {
      expect(canActorSubmitCard("approver", MANAGER_ID, OWNER_ID, null)).toBe(false);
    });
  });

  describe("unknown role", () => {
    it("always returns false", () => {
      expect(canActorSubmitCard("unknown", OWNER_ID, OWNER_ID, MANAGER_ID)).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// reward/calculate: directParamsSchema
// ---------------------------------------------------------------------------

describe("directParamsSchema", () => {
  it("accepts valid positive numbers", () => {
    const result = directParamsSchema.safeParse({
      baseSalary: 100000,
      salaryMultiplier: 3,
      triggerGoalPct: 80,
      individualKpiPct: 95,
    });
    expect(result.success).toBe(true);
  });

  it("accepts zero values", () => {
    const result = directParamsSchema.safeParse({
      baseSalary: 0,
      salaryMultiplier: 0,
      triggerGoalPct: 0,
      individualKpiPct: 0,
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative baseSalary", () => {
    const result = directParamsSchema.safeParse({
      baseSalary: -1,
      salaryMultiplier: 3,
      triggerGoalPct: 80,
      individualKpiPct: 95,
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    const result = directParamsSchema.safeParse({ baseSalary: 100 });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// reward/calculate: cardBasedSchema
// ---------------------------------------------------------------------------

describe("cardBasedSchema", () => {
  it("accepts valid UUID", () => {
    expect(cardBasedSchema.safeParse({ cardId: VALID_UUID }).success).toBe(true);
  });

  it("rejects non-UUID", () => {
    expect(cardBasedSchema.safeParse({ cardId: "abc" }).success).toBe(false);
  });

  it("rejects missing cardId", () => {
    expect(cardBasedSchema.safeParse({}).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// reward/calculate: buildRewardResult
// ---------------------------------------------------------------------------

describe("buildRewardResult", () => {
  it("computes reward = baseSalary × multiplier × triggerPct/100 × kpiPct/100", () => {
    // 100000 × 3 × 80/100 × 95/100 = 100000 × 3 × 0.8 × 0.95 = 228000
    const result = buildRewardResult(100000, 3, 80, 95);
    expect(result.reward).toBeCloseTo(228000, 2);
  });

  it("echoes back all inputs", () => {
    const result = buildRewardResult(50000, 2, 100, 100);
    expect(result.inputs).toEqual({
      baseSalary: 50000,
      salaryMultiplier: 2,
      triggerGoalPct: 100,
      individualKpiPct: 100,
    });
  });

  it("returns 0 when baseSalary is 0", () => {
    expect(buildRewardResult(0, 3, 80, 95).reward).toBe(0);
  });

  it("returns 0 when triggerGoalPct is 0", () => {
    expect(buildRewardResult(100000, 3, 0, 95).reward).toBe(0);
  });

  it("returns 0 when individualKpiPct is 0", () => {
    expect(buildRewardResult(100000, 3, 80, 0).reward).toBe(0);
  });

  it("handles fractional percentages", () => {
    // 60000 × 1 × 33.3/100 × 66.6/100 = 60000 × 0.333 × 0.666 ≈ 13306.68
    const result = buildRewardResult(60000, 1, 33.3, 66.6);
    expect(result.reward).toBeCloseTo(13306.68, 1);
  });
});

// ---------------------------------------------------------------------------
// reward/calculate: participantCanViewCard
// ---------------------------------------------------------------------------

describe("participantCanViewCard", () => {
  it("returns true when actor is the card owner", () => {
    expect(participantCanViewCard("user-1", "user-1")).toBe(true);
  });

  it("returns false when actor is not the card owner", () => {
    expect(participantCanViewCard("user-1", "user-2")).toBe(false);
  });
});
