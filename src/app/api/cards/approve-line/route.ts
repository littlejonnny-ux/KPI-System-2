/**
 * POST /api/cards/approve-line
 *
 * Atomically approves a single KPI card line.
 * Delegates to the `approve_card_line` PostgreSQL function which:
 *   1. Sets is_approved = true, approved_by, approved_at on the line
 *   2. Checks if all L1 lines are now approved → auto-sets card status to 'approved'
 *
 * Auth:   admin or approver only
 * Status: card must be in pending_approval
 *
 * ARCHITECTURE_PRINCIPLES §8 — one transaction via RPC.
 * ARCHITECTURE_PRINCIPLES §9 — server is source of truth for validation.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser, canApproveOrReturn } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Input schema
// ---------------------------------------------------------------------------

export const approveLineSchema = z.object({
  lineId: z.string().uuid("lineId must be a valid UUID"),
  cardId: z.string().uuid("cardId must be a valid UUID"),
  comment: z.string().max(1000).nullable().optional(),
});

export type ApproveLineInput = z.infer<typeof approveLineSchema>;

// ---------------------------------------------------------------------------
// Business-rule helpers (exported for unit tests)
// ---------------------------------------------------------------------------

/** Returns true when the card status allows line approval */
export function isCardApprovable(status: string): boolean {
  return status === "pending_approval";
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

  // 2. Role check — only admin / approver may approve
  if (!canApproveOrReturn(user)) {
    return NextResponse.json(
      { error: "Forbidden: only approver or admin can approve lines" },
      { status: 403 },
    );
  }

  // 3. Parse + validate body
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = approveLineSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { lineId, cardId, comment } = parsed.data;
  const supabase = await createClient();

  // 4. Load card — verify it exists and has the right status
  const { data: card, error: cardError } = await supabase
    .from("kpi_cards")
    .select("id, status")
    .eq("id", cardId)
    .single();

  if (cardError || !card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  if (!isCardApprovable(card.status)) {
    return NextResponse.json(
      {
        error: `Card must be in 'pending_approval' status (current: '${card.status}')`,
      },
      { status: 400 },
    );
  }

  // 5. Verify line belongs to the card and is not already approved
  const { data: line, error: lineError } = await supabase
    .from("kpi_card_lines")
    .select("id, card_id, is_approved")
    .eq("id", lineId)
    .eq("card_id", cardId)
    .single();

  if (lineError || !line) {
    return NextResponse.json(
      { error: "Line not found or does not belong to this card" },
      { status: 404 },
    );
  }

  if (line.is_approved) {
    return NextResponse.json(
      { error: "Line is already approved" },
      { status: 400 },
    );
  }

  // 6. Atomic approval via PostgreSQL function
  const { error: rpcError } = await supabase.rpc("approve_card_line", {
    p_line_id: lineId,
    p_approver_id: user.userId,
    p_comment: comment ?? null,
  });

  if (rpcError) {
    return NextResponse.json(
      { error: "Failed to approve line", details: rpcError.message },
      { status: 500 },
    );
  }

  // 7. Audit log (non-critical — don't fail the request if it errors)
  await supabase.from("audit_log").insert({
    entity_type: "kpi_card_lines",
    entity_id: lineId,
    action: "line_approved" as const,
    new_value: { card_id: cardId, approver_id: user.userId, comment: comment ?? null },
    comment: comment ?? null,
    performed_by: user.userId,
  });

  return NextResponse.json({ success: true });
}
