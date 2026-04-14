"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboardIcon,
  ActivityIcon,
  UsersIcon,
  BookOpenIcon,
  TargetIcon,
  LayoutGridIcon,
  DatabaseIcon,
  ArchiveIcon,
  FileTextIcon,
  CheckCircleIcon,
  HomeIcon,
  UserIcon,
  LogOutIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/auth-provider";
import type { SystemRole } from "@/types/kpi";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const ADMIN_NAV: NavItem[] = [
  { label: "Дашборд", href: "/", icon: LayoutDashboardIcon },
  { label: "Лента событий", href: "/feed", icon: ActivityIcon },
  { label: "Участники", href: "/participants", icon: UsersIcon },
  { label: "Библиотека KPI", href: "/library", icon: BookOpenIcon },
  { label: "Запускающие цели", href: "/objectives", icon: TargetIcon },
  { label: "Карты KPI", href: "/cards", icon: LayoutGridIcon },
  { label: "Справочники", href: "/references", icon: DatabaseIcon },
  { label: "Архив", href: "/archive", icon: ArchiveIcon },
];

const APPROVER_NAV: NavItem[] = [
  { label: "Дашборд", href: "/", icon: LayoutDashboardIcon },
  { label: "Лента событий", href: "/feed", icon: ActivityIcon },
  { label: "Мои карты", href: "/my-cards", icon: FileTextIcon },
  { label: "На согласовании", href: "/approvals", icon: CheckCircleIcon },
  { label: "Архив", href: "/archive", icon: ArchiveIcon },
];

const PARTICIPANT_NAV: NavItem[] = [
  { label: "Главная", href: "/", icon: HomeIcon },
  { label: "Мои карты", href: "/my-cards", icon: FileTextIcon },
  { label: "Архив", href: "/archive", icon: ArchiveIcon },
];

function getNavItems(role: SystemRole): NavItem[] {
  if (role === "admin") return ADMIN_NAV;
  if (role === "approver") return APPROVER_NAV;
  return PARTICIPANT_NAV;
}

interface SidebarNavProps {
  role: SystemRole;
}

export function SidebarNav({ role }: SidebarNavProps) {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const navItems = getNavItems(role);

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-border px-6">
        <span className="font-semibold tracking-tight">KPI System</span>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom: profile + sign out */}
      <div className="border-t border-border p-3 space-y-0.5">
        <Link
          href="/profile"
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
            pathname === "/profile"
              ? "bg-accent text-accent-foreground font-medium"
              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
          )}
        >
          <UserIcon className="h-4 w-4 shrink-0" />
          Мой профиль
        </Link>
        <button
          onClick={() => signOut()}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
        >
          <LogOutIcon className="h-4 w-4 shrink-0" />
          Выйти
        </button>
      </div>
    </aside>
  );
}
