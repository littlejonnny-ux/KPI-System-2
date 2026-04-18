"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-provider";

export function LogoutButton() {
  const { signOut } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await signOut();
    router.push("/login");
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      data-testid="logout"
      onClick={handleLogout}
    >
      Выйти
    </Button>
  );
}
