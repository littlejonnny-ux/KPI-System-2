import { redirect } from "next/navigation";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { SidebarNav } from "@/features/auth/components/sidebar-nav";
import { Header } from "@/features/auth/components/header";
import type { SystemRole } from "@/types/kpi";

// Routes accessible only by specific roles.
// Omitting a prefix means all authenticated roles can access it.
const ROUTE_PERMISSIONS: Record<string, SystemRole[]> = {
  "/participants": ["admin"],
  "/library": ["admin"],
  "/objectives": ["admin"],
  "/cards": ["admin"],
  "/references": ["admin"],
  "/approvals": ["approver"],
};

function isAllowed(pathname: string, role: SystemRole): boolean {
  for (const [prefix, allowed] of Object.entries(ROUTE_PERMISSIONS)) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) {
      return allowed.includes(role);
    }
  }
  return true;
}

interface DashboardLayoutProps {
  children: ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: userRow } = await supabase
    .from("users")
    .select("full_name, system_role, is_active")
    .eq("auth_id", user.id)
    .single();

  if (!userRow || !userRow.is_active) {
    redirect("/login");
  }

  const role = userRow.system_role as SystemRole;
  const userName = userRow.full_name ?? user.email ?? "";

  // Role-based route protection
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "/";

  if (!isAllowed(pathname, role)) {
    redirect("/");
  }

  return (
    <div className="flex h-full min-h-screen">
      <SidebarNav role={role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header userName={userName} role={role} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
