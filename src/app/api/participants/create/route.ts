/**
 * POST /api/participants/create
 *
 * Creates a new participant:
 *   1. Creates Supabase Auth user (email_confirm: true) with the provided password
 *   2. Inserts a row into the users table
 *
 * Auth:   admin only
 * The provided password is NOT stored — it is set directly in Supabase Auth.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { getAuthenticatedUser, isAdmin } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Input schema
// ---------------------------------------------------------------------------

const createParticipantSchema = z.object({
  workEmail: z.string().email("Invalid email"),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  middleName: z.string().max(100).nullable().optional(),
  systemRole: z.enum(["admin", "approver", "participant"]),
  approverId: z.string().uuid().nullable().optional(),
  baseSalary: z.number().positive().nullable().optional(),
  salaryMultiplier: z.number().positive().nullable().optional(),
  levelValueId: z.string().uuid().nullable().optional(),
  companyRoleId: z.string().uuid().nullable().optional(),
  password: z.string().min(8).max(128),
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

  const parsed = createParticipantSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const {
    workEmail,
    firstName,
    lastName,
    middleName,
    systemRole,
    approverId,
    baseSalary,
    salaryMultiplier,
    levelValueId,
    companyRoleId,
    password,
  } = parsed.data;

  // Admin client for Auth operations
  const adminClient = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // 1. Create Supabase Auth user
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: workEmail,
    password,
    email_confirm: true,
  });

  if (authError) {
    if (authError.message.toLowerCase().includes("already registered") ||
        authError.message.toLowerCase().includes("already exists")) {
      return NextResponse.json(
        { error: "Пользователь с таким email уже существует" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Failed to create auth user", details: authError.message },
      { status: 500 },
    );
  }

  const authUserId = authData.user.id;

  // 2. Insert users table row
  const supabase = await createClient();
  const { data: profile, error: insertError } = await supabase
    .from("users")
    .insert({
      auth_id: authUserId,
      work_email: workEmail,
      first_name: firstName,
      last_name: lastName,
      middle_name: middleName ?? null,
      system_role: systemRole,
      approver_id: approverId ?? null,
      base_salary: baseSalary ?? null,
      salary_multiplier: salaryMultiplier ?? null,
      level_value_id: levelValueId ?? null,
      company_role_id: companyRoleId ?? null,
      is_active: true,
    })
    .select("id")
    .single();

  if (insertError || !profile) {
    // Compensating transaction: remove the auth user if users table insert fails
    await adminClient.auth.admin.deleteUser(authUserId);
    return NextResponse.json(
      { error: "Failed to create user profile", details: insertError?.message },
      { status: 500 },
    );
  }

  // Audit log (non-critical)
  await supabase.from("audit_log").insert({
    entity_type: "users",
    entity_id: profile.id,
    action: "create" as const,
    new_value: { work_email: workEmail, system_role: systemRole },
    performed_by: user.userId,
  });

  return NextResponse.json({ id: profile.id }, { status: 201 });
}
