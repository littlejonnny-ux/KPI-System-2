/**
 * POST /api/participants/import
 *
 * Bulk import participants from Excel.
 * For each row: creates Supabase Auth user, then calls import_participants_bulk RPC
 * to insert all successfully-created users into the users table atomically.
 *
 * Max 500 rows per request.
 * Duplicate emails are non-blocking: returned as per-row errors.
 *
 * Auth: admin only
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { getAuthenticatedUser, isAdmin } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Input schema
// ---------------------------------------------------------------------------

const participantRowSchema = z.object({
  workEmail: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  middleName: z.string().max(100).nullable().optional(),
  systemRole: z.enum(["admin", "approver", "participant"]).default("participant"),
  approverId: z.string().uuid().nullable().optional(),
  baseSalary: z.number().positive().nullable().optional(),
  salaryMultiplier: z.number().positive().nullable().optional(),
  levelValueId: z.string().uuid().nullable().optional(),
  companyRoleId: z.string().uuid().nullable().optional(),
});

const importSchema = z.object({
  participants: z.array(participantRowSchema).min(1).max(500),
  defaultPassword: z.string().min(8).max(128),
});

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdmin(user)) {
    return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = importSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { participants, defaultPassword } = parsed.data;

  const adminClient = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Phase 1: create Auth users one by one (non-atomic, per-row error handling)
  const authResults: Array<{
    authId: string;
    workEmail: string;
    row: (typeof participants)[number];
  }> = [];
  const rowErrors: Array<{ email: string; reason: string }> = [];

  for (const participant of participants) {
    const { data, error } = await adminClient.auth.admin.createUser({
      email: participant.workEmail,
      password: defaultPassword,
      email_confirm: true,
    });

    if (error) {
      const reason =
        error.message.toLowerCase().includes("already") ||
        error.message.toLowerCase().includes("registered")
          ? "Пользователь с таким email уже существует"
          : error.message;
      rowErrors.push({ email: participant.workEmail, reason });
    } else {
      authResults.push({
        authId: data.user.id,
        workEmail: participant.workEmail,
        row: participant,
      });
    }
  }

  if (authResults.length === 0) {
    return NextResponse.json({
      created: 0,
      skipped: 0,
      errors: rowErrors,
    });
  }

  // Phase 2: bulk insert into users table via RPC
  const rpcData = authResults.map(({ authId, row }) => ({
    auth_id: authId,
    work_email: row.workEmail,
    first_name: row.firstName,
    last_name: row.lastName,
    middle_name: row.middleName ?? null,
    system_role: row.systemRole ?? "participant",
    approver_id: row.approverId ?? null,
    base_salary: row.baseSalary ?? null,
    salary_multiplier: row.salaryMultiplier ?? null,
    level_value_id: row.levelValueId ?? null,
    company_role_id: row.companyRoleId ?? null,
  }));

  const supabase = await createClient();
  const { data: rpcResult, error: rpcError } = await supabase.rpc(
    "import_participants_bulk",
    { p_data: rpcData },
  );

  if (rpcError) {
    // Compensating: delete all auth users we just created
    const deletions = await Promise.allSettled(
      authResults.map(({ authId }) => adminClient.auth.admin.deleteUser(authId)),
    );
    const failedDeletions = deletions
      .map((r, i) => (r.status === "rejected" ? authResults[i].authId : null))
      .filter(Boolean);
    if (failedDeletions.length > 0) {
      console.error("import rollback: failed to delete orphaned auth users", failedDeletions);
    }
    return NextResponse.json(
      { error: "Bulk import failed", details: rpcError.message },
      { status: 500 },
    );
  }

  const result = rpcResult as { created: number; skipped: number; errors: Array<{ email: string; reason: string }> };

  // Merge row errors (auth failures) with RPC errors (DB failures)
  const allErrors = [...rowErrors, ...(result.errors ?? [])];

  return NextResponse.json({
    created: result.created ?? 0,
    skipped: result.skipped ?? 0,
    errors: allErrors,
  });
}
