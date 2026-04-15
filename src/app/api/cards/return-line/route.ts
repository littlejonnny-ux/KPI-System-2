/**
 * POST /api/cards/return-line
 *
 * Returns (rejects) a KPI card line with a mandatory approver comment.
 * Updates:
 *   1. kpi_card_lines.approver_comment → the provided comment
 *   2. kpi_cards.status → 'returned'
 *
 * Auth:   admin or approver only
 * Status: card must be in pending_approval
 *
 * Comment is mandatory per ТЗ section 8.1, step 4.
 *
 * ARCHITECTURE_PRINCIPLES §9 — server is source of truth.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser, canApproveOrReturn } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Input schema
// ---------------------------------------------------------------------------

export const returnLineSchema = z.object({
  lineId: z.string().uuid("lineId must be a valid UUID"),
  cardId: z.string().uuid("cardId must be a valid UUID"),
  comment: z.string().min(1, "Comment is required").max(1000),
});

export type ReturnLineInput = z.infer<typeof returnLineSchema>;

// ---------------------------------------------------------------------------
// Business-rule helpers (exported for unit tests)
// ---------------------------------------------------------------------------

/** Card must be in pending_approval for a line to be returnable */
export function isCardReturnable(status: string): boolean {
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

  // 2. Role check
  if (!canApproveOrReturn(user)) {
    return NextResponse.json(
      { error: "Forbidden: only approver or admin can return lines" },
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

  const parsed = returnLineSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { lineId, cardId, comment } = parsed.data;
  const supabase = await createClient();

  // 4. Load card
  const { data: card, error: cardError } = await supabase
    .from("kpi_cards")
    .select("id, status")
    .eq("id", cardId)
    .single();

  if (cardError || !card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  if (!isCardReturnable(card.status)) {
    return NextResponse.json(
      {
        error: `Card must be in 'pending_approval' status (current: '${card.status}')`,
      },
      { status: 400 },
    );
  }

  // 5. Verify line belongs to the card
  const { data: line, error: lineError } = await supabase
    .from("kpi_card_lines")
    .select("id, card_id")
    .eq("id", lineId)
    .eq("card_id", cardId)
    .single();

  if (lineError || !line) {
    return NextResponse.json(
      { error: "Line not found or does not belong to this card" },
      { status: 404 },
    );
  }

  const now = new Date().toISOString();

  // 6. Update line with approver_comment
  const { error: lineUpdateError } = await supabase
    .from("kpi_card_lines")
    .update({ approver_comment: comment, updated_at: now })
    .eq("id", lineId);

  if (lineUpdateError) {
    return NextResponse.json(
      { error: "Failed to update line", details: lineUpdateError.message },
      { status: 500 },
    );
  }

  // 7. Update card status → returned
  const { error: cardUpdateError } = await supabase
    .from("kpi_cards")
    .update({ status: "returned", updated_at: now })
    .eq("id", cardId);

  if (cardUpdateError) {
    return NextResponse.json(
      { error: "Failed to update card status", details: cardUpdateError.message },
      { status: 500 },
    );
  }

  // 8. Audit log + event (non-critical)
  await supabase.from("audit_log").insert({
    entity_type: "kpi_card_lines",
    entity_id: lineId,
    action: "returned" as const,
    new_value: { card_id: cardId, approver_id: user.userId, comment },
    comment,
    performed_by: user.userId,
  });

  await supabase.from("events").insert({
    event_type: "card_returned" as const,
    title: "Карта возвращена на доработку",
    description: comment,
    related_card_id: cardId,
    created_by: user.userId,
  });

  return NextResponse.json({ success: true });
}
