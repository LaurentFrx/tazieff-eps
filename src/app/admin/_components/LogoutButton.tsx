"use client";

// Sprint P0.7 — Bouton de déconnexion admin.
// Appelle supabase.auth.signOut() puis redirige vers /login (réécrit
// en /admin/login par le proxy host-based).

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type Props = {
  label: string;
};

export function LogoutButton({ label }: Props) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleClick = async () => {
    setIsLoggingOut(true);
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // signOut peut échouer en cas de réseau down — on redirige quand même.
      }
    }
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoggingOut}
      className="mt-2 inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-white hover:bg-white/[0.1] disabled:opacity-50"
      data-testid="admin-logout"
    >
      {label}
    </button>
  );
}
