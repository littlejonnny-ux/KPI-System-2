import type { ReactNode } from "react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-full min-h-screen">
      {/* Sidebar — будет реализован в Stage 4 */}
      <aside className="w-64 shrink-0 border-r border-border bg-card">
        <div className="flex h-14 items-center border-b border-border px-6">
          <span className="font-semibold tracking-tight">KPI System</span>
        </div>
        <nav className="p-4">
          <p className="text-xs text-muted-foreground">Навигация — Stage 4</p>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center border-b border-border px-6">
          <p className="text-sm text-muted-foreground">Шапка — Stage 4</p>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
