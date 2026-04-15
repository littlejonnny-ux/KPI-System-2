"use client";

import { useAuth } from "@/features/auth/auth-provider";
import { AdminDashboard } from "@/features/dashboard/components/admin-dashboard";
import { ApproverDashboard } from "@/features/dashboard/components/approver-dashboard";
import { ParticipantDashboard } from "@/features/dashboard/components/participant-dashboard";

export default function DashboardPage() {
  const { profile, loading, isAdmin, isApprover, isParticipant } = useAuth();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-muted/50 animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-lg bg-muted/50 animate-pulse" />
      </div>
    );
  }

  if (isAdmin) {
    return <AdminDashboard />;
  }

  if (isApprover && profile) {
    return <ApproverDashboard profile={profile} />;
  }

  if (isParticipant && profile) {
    return <ParticipantDashboard profile={profile} />;
  }

  return (
    <div className="flex items-center justify-center py-24">
      <p className="text-sm text-muted-foreground">Нет доступа к дашборду</p>
    </div>
  );
}
