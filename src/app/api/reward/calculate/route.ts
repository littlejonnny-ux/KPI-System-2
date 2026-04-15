/**
 * POST /api/reward/calculate
 *
 * Server-side reward calculation.  Two modes:
 *
 *   1. Card-based  (cardId provided):
 *      Fetches baseSalary + salaryMultiplier from users, official_execution_pct
 *      from trigger_goals, and total_execution_pct from kpi_cards; then applies
 *      the formula from ТЗ section 6.4.
 *
 *   2. Direct-params (no cardId):
 *      Accepts { baseSalary, salaryMultiplier, triggerGoalPct, individualKpiPct }
 *      and returns the result without any DB access.
 *
 * Auth:
 *   - Any authenticated user may POST with direct params.
 *   - Card-based: participant may only calculate for their own card;
 *     approver/admin may calculate for any card.
 *
 * Formula: reward = baseSalary × salaryMultiplier × triggerGoalPct/100 × individualKpiPct/100
 *
 * ARCHITECTURE_PRINCIPLES §9 — server is source of truth for formula evaluation.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";
import { calcReward } from "@/lib/calculations";

// ---------------------------------------------------------------------------
// Input schemas (exported for unit tests)
// ---------------------------------------------------------------------------

export const directParamsSchema = z.object({
  baseSalary: z.number().nonnegative("baseSalary must be ≥ 0"),
  salaryMultiplier: z.number().nonnegative("salaryMultiplier must be ≥ 0"),
  triggerGoalPct: z.number().min(0).max(200),
  individualKpiPct: z.number().min(0).max(200),
});

export const cardBasedSchema = z.object({
  cardId: z.string().uuid("cardId must be a valid UUID"),
});

export type DirectParamsInput = z.infer<typeof directParamsSchema>;

// ---------------------------------------------------------------------------
// Business-rule helpers (exported for unit tests)
// ---------------------------------------------------------------------------

export interface RewardResult {
  reward: number;
  inputs: {
    baseSalary: number;
    salaryMultiplier: number;
    triggerGoalPct: number;
    individualKpiPct: number;
  };
}

/** Pure calculation — delegates to calcReward(), wraps result with inputs. */
export function buildRewardResult(
  baseSalary: number,
  salaryMultiplier: number,
  triggerGoalPct: number,
  individualKpiPct: number,
): RewardResult {
  return {
    reward: calcReward(baseSalary, salaryMultiplier, triggerGoalPct, individualKpiPct),
    inputs: { baseSalary, salaryMultiplier, triggerGoalPct, individualKpiPct },
  };
}

/** Returns true when a participant is allowed to see this card's reward. */
export function participantCanViewCard(
  actorUserId: string,
  cardOwnerId: string,
): boolean {
  return actorUserId === cardOwnerId;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  // 1. Verify session
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse body
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // 3. Detect mode and validate
  const bodyObj = rawBody as Record<string, unknown>;

  // Direct-params mode: no cardId provided
  if (!("cardId" in bodyObj)) {
    const parsed = directParamsSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { baseSalary, salaryMultiplier, triggerGoalPct, individualKpiPct } = parsed.data;
    return NextResponse.json(
      buildRewardResult(baseSalary, salaryMultiplier, triggerGoalPct, individualKpiPct),
    );
  }

  // Card-based mode
  const cardParsed = cardBasedSchema.safeParse(rawBody);
  if (!cardParsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: cardParsed.error.issues },
      { status: 400 },
    );
  }

  const { cardId } = cardParsed.data;
  const supabase = await createClient();

  // 4. Load card with user salary data and trigger goal pct
  const { data: card, error: cardError } = await supabase
    .from("kpi_cards")
    .select(
      `
      id,
      user_id,
      total_execution_pct,
      trigger_goal_id,
      users!inner ( base_salary, salary_multiplier ),
      trigger_goals ( official_execution_pct )
    `,
    )
    .eq("id", cardId)
    .single();

  if (cardError || !card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  // 5. Access control — participant may only view their own card
  if (
    user.systemRole === "participant" &&
    !participantCanViewCard(user.userId, card.user_id)
  ) {
    return NextResponse.json(
      { error: "Forbidden: you may only calculate reward for your own card" },
      { status: 403 },
    );
  }

  // 6. Extract salary fields from joined user record
  const ownerUser = card.users as unknown as { base_salary: number | null; salary_multiplier: number | null } | null;
  if (!ownerUser) {
    return NextResponse.json(
      { error: "User salary data not found for this card" },
      { status: 422 },
    );
  }
  const baseSalary = ownerUser.base_salary ?? 0;
  const salaryMultiplier = ownerUser.salary_multiplier ?? 0;

  // 7. Extract trigger goal pct (official) — null means not configured
  const triggerGoalRecord = card.trigger_goals as unknown as { official_execution_pct: number | null } | null;
  const triggerGoalPct = triggerGoalRecord?.official_execution_pct ?? null;

  if (triggerGoalPct === null) {
    return NextResponse.json(
      { error: "Trigger goal execution % is not set for this card" },
      { status: 422 },
    );
  }

  // 8. Individual KPI % from card
  const individualKpiPct = card.total_execution_pct ?? null;

  if (individualKpiPct === null) {
    return NextResponse.json(
      { error: "Card KPI execution % is not yet calculated" },
      { status: 422 },
    );
  }

  return NextResponse.json(
    buildRewardResult(baseSalary, salaryMultiplier, triggerGoalPct, individualKpiPct),
  );
}
