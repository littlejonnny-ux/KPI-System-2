/**
 * Auth helper for Next.js App Router API routes.
 *
 * Uses the anon-key session client to verify the JWT (reads cookies),
 * then loads the full user profile via service_role (bypasses RLS).
 *
 * All API routes call getAuthenticatedUser() as the first step.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient as createServiceClient } from "@/lib/supabase/server";
import type { SystemRole } from "@/types/kpi";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuthenticatedUser {
  /** Supabase Auth UUID */
  authId: string;
  /** Internal users.id UUID */
  userId: string;
  systemRole: SystemRole;
  workEmail: string;
}

// ---------------------------------------------------------------------------
// Role helpers
// ---------------------------------------------------------------------------

export function isAdmin(user: AuthenticatedUser): boolean {
  return user.systemRole === "admin";
}

export function isApprover(user: AuthenticatedUser): boolean {
  return user.systemRole === "approver";
}

export function isParticipant(user: AuthenticatedUser): boolean {
  return user.systemRole === "participant";
}

export function canApproveOrReturn(user: AuthenticatedUser): boolean {
  return user.systemRole === "admin" || user.systemRole === "approver";
}

// ---------------------------------------------------------------------------
// Session verification
// ---------------------------------------------------------------------------

/**
 * Verifies the Supabase session from cookies and loads the user profile.
 *
 * Returns null if the request is unauthenticated or the profile is missing.
 * Uses anon key for JWT verification + service_role for profile fetch.
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const cookieStore = await cookies();

  // Anon-key client to verify the session JWT via Supabase Auth server
  const sessionClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from Route Handler where cookies are read-only — safe to ignore
          }
        },
      },
    },
  );

  const {
    data: { user },
    error,
  } = await sessionClient.auth.getUser();

  if (error || !user) return null;

  // Service-role client to read the user profile (bypasses RLS)
  const serviceClient = await createServiceClient();
  const { data: profile } = await serviceClient
    .from("users")
    .select("id, system_role, work_email")
    .eq("auth_id", user.id)
    .single();

  if (!profile) return null;

  return {
    authId: user.id,
    userId: profile.id,
    systemRole: profile.system_role as SystemRole,
    workEmail: profile.work_email,
  };
}
