"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="inline-flex items-center gap-2 rounded-md border border-outline px-3 py-2 text-sm font-semibold text-ink transition-colors hover:bg-surface-low"
    >
      <LogOut className="size-4" />
      Sair
    </button>
  );
}
