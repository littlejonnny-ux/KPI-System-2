/**
 * POST /api/cards/submit
 *
 * Submits a KPI card for approval (status → 'pending_approval').
 *
 * Auth rules (ТЗ section 8.1, step 2):
 *   - participant: can submit only their own card
 *   - approver: can submit their own card OR cards of their direct subordinates
 *   - admin: can submit any card
 *
 * Card must be in draft | active | returned status.
 * Creates an audit_log entry and a card_submitted event.
 *
 * ARCHITECTURE_PRINCIPLES §9 — server validates all state transitions.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Input schema
// ---------------------------------------------------------------------------

export const submitCardSchema = z.object({
  cardId: z.string().uuid("cardId must be a valid UUID"),
});

export type SubmitCardInput = z.infer<typeof submitCardSchema>;

// ---------------------------------------------------------------------------
// Business-rule helpers (exported for unit tests)
// ---------------------------------------------------------------------------

export const SUBMITTABLE_STATUSES = ["draft", "active", "returned"] as const;
export type SubmittableStatus = (typeof SUBMITTABLE_STATUSES)[number];

/** Returns true when the card status allows submission */
export function isCardSubmittable(status: string): boolean {
  return (SUBMITTABLE_STATUSES as readonly string[]).includes(status);
}

/**
 * Returns true if the actor can submit this card.
 *
 * @param actorRole      system_role of the actor
 * @param actorUserId    users.id of the actor
 * @param cardOwnerId    users.id of the card owner
 * @param ownerApproverId approver_id of the card owner (their manager)
 */
export function canActorSubmitCard(
  actorRole: string,
  actorUserId: string,
  cardOwnerId: string,
  ownerApproverId: string | null,
): boolean {
  if (actorRole === "admin") return true;

  const isOwnCard = actorUserId === cardOwnerId;

  if (actorRole === "participant") return isOwnCard;

  if (actorRole === "approver") {
    const isSubordinateCard = ownerApproverId === actorUserId;
    return isOwnCard || isSubordinateCard;
  }

  return false;
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

  // 2. Parse + validate body
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = submitCardSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { cardId } = parsed.data;
  const supabase = await createClient();

  // 3. Load card with owner's approver_id (needed for access control)
  const { data: card, error: cardError } = await supabase
    .from("kpi_cards")
    .select(
      `
      id,
      status,
      user_id,
      users!inner ( approver_id )
    `,
    )
    .eq("id", cardId)
    .single();

  if (cardError || !card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  // 4. Access control
  const ownerRecord = card.users as unknown as { approver_id: string | null } | null;
  const ownerApproverId = ownerRecord?.approver_id ?? null;

  if (
    !canActorSubmitCard(
      user.systemRole,
      user.userId,
      card.user_id,
      ownerApproverId,
    )
  ) {
    return NextResponse.json(
      { error: "Forbidden: you do not have permission to submit this card" },
      { status: 403 },
    );
  }

  // 5. Status check
  if (!isCardSubmittable(card.status)) {
    return NextResponse.json(
      {
        error: `Card cannot be submitted from status '${card.status}'. Must be one of: ${SUBMITTABLE_STATUSES.join(", ")}`,
      },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();

  // 6. Update status → pending_approval
  const { error: updateError } = await supabase
    .from("kpi_cards")
    .update({ status: "pending_approval", updated_at: now })
    .eq("id", cardId);

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to submit card", details: updateError.message },
      { status: 500 },
    );
  }

  // 7. Audit log + event (non-critical)
  await supabase.from("audit_log").insert({
    entity_type: "kpi_cards",
    entity_id: cardId,
    action: "submitted" as const,
    new_value: { previous_status: card.status, new_status: "pending_approval" },
    performed_by: user.userId,
  });

  await supabase.from("events").insert({
    event_type: "card_submitted" as const,
    title: "Карта отправлена на согласование",
    related_card_id: cardId,
    created_by: user.userId,
  });

  return NextResponse.json({ success: true });
}
