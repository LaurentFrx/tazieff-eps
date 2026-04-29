"use client";

// Sprint E.4 (29 avril 2026) — Client interactif de la page /prof/profil.
//
// Affiche un formulaire par membership active : champ display_name, bouton
// Enregistrer, état d'envoi + message de retour. PATCH /api/me/profile
// envoie un seul (organization_id, display_name) à la fois.

import { useState } from "react";

export type MembershipDisplayItem = {
  organization_id: string;
  organization_name: string;
  role: string;
  display_name: string | null;
};

type Props = {
  userEmail: string;
  memberships: MembershipDisplayItem[];
  loadError?: string | null;
};

export default function ProfilClient({
  userEmail,
  memberships,
  loadError,
}: Props) {
  if (loadError) {
    return (
      <p style={{ color: "#FF6B6B" }}>
        Impossible de charger tes établissements. {loadError}
      </p>
    );
  }
  if (memberships.length === 0) {
    return (
      <div
        style={{
          padding: 16,
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.03)",
        }}
      >
        <p style={{ color: "rgba(255,255,255,0.7)" }}>
          Tu n&apos;es membre d&apos;aucun établissement actif.
        </p>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 8 }}>
          Compte connecté : {userEmail}
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
        Compte connecté : {userEmail}
      </p>
      {memberships.map((m) => (
        <MembershipForm key={m.organization_id} membership={m} />
      ))}
    </div>
  );
}

function MembershipForm({
  membership,
}: {
  membership: MembershipDisplayItem;
}) {
  const [value, setValue] = useState<string>(membership.display_name ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [successAt, setSuccessAt] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const trimmed = value.trim();
  const isEmpty = trimmed.length === 0;
  const isInvalidLength =
    !isEmpty && (trimmed.length < 2 || trimmed.length > 50);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isInvalidLength) {
      setErrorMsg("Le nom doit contenir entre 2 et 50 caractères.");
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessAt(null);
    try {
      const res = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organization_id: membership.organization_id,
          // Vide => on envoie null pour effacer côté BD.
          display_name: isEmpty ? null : trimmed,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const detail =
          body.details?.display_name?.[0] ??
          body.details?.message ??
          body.error ??
          `HTTP ${res.status}`;
        setErrorMsg(detail);
      } else {
        setSuccessAt(Date.now());
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erreur réseau");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        padding: 16,
        borderRadius: 12,
        border: "1px solid rgba(255,140,0,0.2)",
        background: "rgba(255,140,0,0.05)",
      }}
    >
      <div style={{ marginBottom: 8 }}>
        <strong style={{ color: "#FF8C00", fontSize: 14 }}>
          {membership.organization_name}
        </strong>
        <span
          style={{
            marginLeft: 8,
            fontSize: 11,
            color: "rgba(255,255,255,0.5)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          {membership.role}
        </span>
      </div>
      <label
        htmlFor={`display-name-${membership.organization_id}`}
        style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}
      >
        Nom d&apos;affichage pour mes élèves
      </label>
      <input
        id={`display-name-${membership.organization_id}`}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Mme Dupont, M. Martin, Frédérique P., etc."
        maxLength={50}
        disabled={submitting}
        style={{
          width: "100%",
          marginTop: 4,
          marginBottom: 8,
          padding: "8px 12px",
          borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.15)",
          background: "rgba(0,0,0,0.3)",
          color: "white",
          fontSize: 14,
        }}
      />
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button
          type="submit"
          disabled={submitting || isInvalidLength}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            background: submitting ? "rgba(255,140,0,0.3)" : "#FF8C00",
            color: "white",
            fontWeight: 600,
            cursor: submitting ? "wait" : "pointer",
          }}
        >
          {submitting ? "Enregistrement…" : "Enregistrer"}
        </button>
        {successAt && Date.now() - successAt < 4000 ? (
          <span style={{ color: "#22C55E", fontSize: 12 }}>✓ Enregistré</span>
        ) : null}
        {errorMsg ? (
          <span style={{ color: "#FF6B6B", fontSize: 12 }}>{errorMsg}</span>
        ) : null}
      </div>
      <p
        style={{
          marginTop: 8,
          fontSize: 11,
          color: "rgba(255,255,255,0.4)",
        }}
      >
        Laisse vide pour utiliser le fallback « Ton prof ».
      </p>
    </form>
  );
}
