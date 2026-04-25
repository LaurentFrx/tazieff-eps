"use client";

// Phase E.2.3.4 — Formulaire de création d'une classe.
// Soumission POST /api/teacher/classes → redirect /mes-classes/[id].

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CLASS_LEVELS } from "@/lib/validation/classes";
import type { MembershipItem } from "@/lib/validation/teacher-me";
import styles from "./nouvelle.module.css";

type Props = {
  memberships: MembershipItem[];
};

export default function CreateClassForm({ memberships }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [level, setLevel] = useState<string>(CLASS_LEVELS[0]);
  const [orgId, setOrgId] = useState(memberships[0]?.org_id ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !orgId) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/teacher/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organization_id: orgId,
          name: name.trim(),
          school_year: level === "Autre" ? undefined : level,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.details?.message ?? body.error ?? `HTTP ${res.status}`);
        setSubmitting(false);
        return;
      }
      const created = (await res.json()) as { id: string };
      router.push(`/mes-classes/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur réseau");
      setSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="class-name">
          Nom de la classe
        </label>
        <input
          id="class-name"
          type="text"
          className={styles.input}
          placeholder="Ex. 2nde B"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={100}
          autoFocus
          disabled={submitting}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="class-level">
          Niveau
        </label>
        <select
          id="class-level"
          className={styles.select}
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          disabled={submitting}
        >
          {CLASS_LEVELS.map((lvl) => (
            <option key={lvl} value={lvl}>
              {lvl}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="class-org">
          Établissement
        </label>
        <select
          id="class-org"
          className={styles.select}
          value={orgId}
          onChange={(e) => setOrgId(e.target.value)}
          disabled={submitting || memberships.length === 1}
        >
          {memberships.map((m) => (
            <option key={m.org_id} value={m.org_id}>
              {m.org_name}
            </option>
          ))}
        </select>
      </div>

      {error && <p className={styles.errorBox}>{error}</p>}

      <div className={styles.actions}>
        <Link href="/mes-classes" className={styles.cancel}>
          Annuler
        </Link>
        <button
          type="submit"
          className={styles.submit}
          disabled={submitting || !name.trim() || !orgId}
        >
          {submitting ? "Création…" : "Créer la classe"}
        </button>
      </div>
    </form>
  );
}
