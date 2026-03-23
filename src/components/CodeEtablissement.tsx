"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const ORG_CODE_KEY = "tazieff-org-code";
const PLAN_CACHE_KEY = "tazieff-plan-cache";

type Status = "idle" | "checking" | "success" | "error";

export function CodeEtablissement() {
  const [code, setCode] = useState(
    () => (typeof window !== "undefined" ? localStorage.getItem(ORG_CODE_KEY) : null) ?? "",
  );
  const [status, setStatus] = useState<Status>(
    () => (typeof window !== "undefined" && localStorage.getItem(ORG_CODE_KEY) ? "success" : "idle"),
  );
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    setStatus("checking");
    setErrorMsg("");

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setStatus("error");
      setErrorMsg("Connexion indisponible. Réessaie plus tard.");
      return;
    }

    try {
      const { data } = await supabase
        .from("organizations")
        .select("id, is_pro, pro_expires_at")
        .eq("code", trimmed)
        .eq("is_pro", true)
        .maybeSingle();

      if (
        data &&
        (!data.pro_expires_at || new Date(data.pro_expires_at) > new Date())
      ) {
        localStorage.setItem(ORG_CODE_KEY, trimmed);
        localStorage.setItem(
          PLAN_CACHE_KEY,
          JSON.stringify({ plan: "pro", timestamp: Date.now() }),
        );
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMsg("Code invalide ou établissement non activé.");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Erreur réseau. Réessaie plus tard.");
    }
  }

  function handleRemove() {
    localStorage.removeItem(ORG_CODE_KEY);
    localStorage.removeItem(PLAN_CACHE_KEY);
    setCode("");
    setStatus("idle");
  }

  return (
    <div className="rounded-xl border border-[color:var(--border)] p-4">
      <h3 className="text-sm font-semibold text-[color:var(--ink)] mb-2">
        Code établissement
      </h3>
      <p className="text-xs text-[color:var(--muted)] mb-3">
        Ton professeur peut te donner un code pour débloquer les fonctionnalités Pro.
      </p>

      {status === "success" ? (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path
                fillRule="evenodd"
                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                clipRule="evenodd"
              />
            </svg>
            {code}
          </span>
          <button
            type="button"
            className="text-xs text-[color:var(--muted)] underline"
            onClick={handleRemove}
          >
            Supprimer
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            className="flex-1 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--ink)] placeholder:text-[color:var(--muted)]"
            placeholder="Ex : TAZIEFF2026"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={status === "checking"}
          />
          <button
            type="submit"
            className="rounded-lg bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            disabled={status === "checking" || !code.trim()}
          >
            {status === "checking" ? "..." : "Valider"}
          </button>
        </form>
      )}

      {status === "error" && (
        <p className="mt-2 text-xs text-red-500">{errorMsg}</p>
      )}
    </div>
  );
}
