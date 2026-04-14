"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/types/kpi";
import type { Tables } from "@/types/database";

// ---------------------------------------------------------------------------
// Mapper: DB row → ViewModel
// ---------------------------------------------------------------------------

function mapUserRow(row: Tables<"users">): UserProfile {
  return {
    id: row.id,
    workEmail: row.work_email,
    firstName: row.first_name,
    lastName: row.last_name,
    middleName: row.middle_name,
    fullName: row.full_name,
    systemRole: row.system_role,
    isActive: row.is_active,
    approverId: row.approver_id,
    baseSalary: row.base_salary,
    salaryMultiplier: row.salary_multiplier,
    levelValueId: row.level_value_id,
    companyRoleId: row.company_role_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Context type
// ---------------------------------------------------------------------------

interface AuthContextValue {
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isApprover: boolean;
  isParticipant: boolean;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Singleton browser client — createBrowserClient is memoised internally,
  // but wrapping in useMemo keeps the reference stable across re-renders.
  const supabase = useMemo(() => createClient(), []);

  const fetchProfile = useCallback(
    async (authId: string) => {
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", authId)
        .single();
      setProfile(data ? mapUserRow(data) : null);
    },
    [supabase],
  );

  const refreshProfile = useCallback(async () => {
    if (session?.user?.id) {
      await fetchProfile(session.user.id);
    }
  }, [session, fetchProfile]);

  // Subscribe to auth state changes. The INITIAL_SESSION event fires on
  // mount and provides the session hydrated from cookies (SSR-compatible).
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      setSession(currentSession);
      if (currentSession?.user) {
        await fetchProfile(currentSession.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error: error?.message ?? null };
    },
    [supabase],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    // onAuthStateChange fires SIGNED_OUT and clears session/profile
  }, [supabase]);

  const isAdmin = profile?.systemRole === "admin";
  const isApprover = profile?.systemRole === "approver";
  const isParticipant = profile?.systemRole === "participant";

  const value: AuthContextValue = {
    session,
    profile,
    loading,
    isAdmin,
    isApprover,
    isParticipant,
    signIn,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
