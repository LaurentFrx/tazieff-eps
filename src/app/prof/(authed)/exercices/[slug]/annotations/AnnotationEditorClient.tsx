"use client";

// Phase E.2.3.6 — Éditeur d'annotation (client).
// Layout responsive : sidebar annotations + zone éditeur.

import { useEffect, useMemo, useState } from "react";
import type { Database } from "@/types/database";
import styles from "./annotations.module.css";

type AnnotationRow = Database["public"]["Tables"]["teacher_annotations"]["Row"] & {
  // Sprint E.4 — section_target a été ajouté à la table par migration et
  // est lu par l'API. Le type Database généré peut ne pas l'inclure si
  // les types n'ont pas été regen. On l'expose explicitement ici pour
  // que le composant compile sans erreur en attendant le re-génération.
  section_target?: string | null;
};
type AnnotationContent = {
  title?: string;
  notes?: string;
};

type VisibilityScope = "private" | "class" | "school";

// Sprint E.4 — sections cibles d'une annotation, alignées sur
// InlineParagraphKey (cf. _teacher-editor/section-matchers.ts) + 'general'.
type SectionTarget =
  | "general"
  | "resume"
  | "execution"
  | "respiration"
  | "conseils"
  | "securite"
  | "dosage";

const SECTION_TARGET_OPTIONS: Array<{ value: SectionTarget; label: string }> = [
  { value: "general", label: "Toute la fiche" },
  { value: "resume", label: "Résumé" },
  { value: "execution", label: "Exécution" },
  { value: "respiration", label: "Respiration" },
  { value: "conseils", label: "Conseils" },
  { value: "securite", label: "Sécurité" },
  { value: "dosage", label: "Dosage" },
];

type Organization = { id: string; name: string };
type ClassItem = { id: string; name: string; organization_id: string };

type Props = {
  exerciseSlug: string;
  exerciseTitle: string;
  exerciseMuscles: string[];
  exerciseLevel: string | null;
  initialAnnotations: AnnotationRow[];
  organizations: Organization[];
  classes: ClassItem[];
  focusedAnnotationId: string | null;
};

type EditorState =
  | { kind: "new" }
  | { kind: "editing"; annotationId: string };

export default function AnnotationEditorClient({
  exerciseSlug,
  exerciseTitle,
  exerciseMuscles,
  exerciseLevel,
  initialAnnotations,
  organizations,
  classes,
  focusedAnnotationId,
}: Props) {
  const [annotations, setAnnotations] =
    useState<AnnotationRow[]>(initialAnnotations);
  const [editor, setEditor] = useState<EditorState>(() => {
    if (focusedAnnotationId) return { kind: "editing", annotationId: focusedAnnotationId };
    return { kind: "new" };
  });

  // Champs du formulaire
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [orgId, setOrgId] = useState(organizations[0]?.id ?? "");
  const [scope, setScope] = useState<VisibilityScope>("private");
  const [classId, setClassId] = useState("");
  const [sectionTarget, setSectionTarget] = useState<SectionTarget>("general");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync des champs selon l'annotation en cours d'édition.
  useEffect(() => {
    if (editor.kind === "new") {
      setTitle("");
      setNotes("");
      setOrgId(organizations[0]?.id ?? "");
      setScope("private");
      setClassId("");
      setSectionTarget("general");
      setErrorMsg(null);
      return;
    }
    const current = annotations.find((a) => a.id === editor.annotationId);
    if (!current) {
      setEditor({ kind: "new" });
      return;
    }
    const c = (current.content as AnnotationContent) ?? {};
    setTitle(c.title ?? "");
    setNotes(c.notes ?? "");
    setOrgId(current.organization_id);
    setScope(current.visibility_scope as VisibilityScope);
    setClassId(current.scope_id ?? "");
    setSectionTarget(
      (current.section_target as SectionTarget | null) ?? "general",
    );
    setErrorMsg(null);
  }, [editor, annotations, organizations]);

  // Classes disponibles pour l'org sélectionné
  const orgClasses = useMemo(
    () => classes.filter((c) => c.organization_id === orgId),
    [classes, orgId],
  );

  // Si scope=class mais aucune classe dans l'org actuelle → désactiver
  const canPickClassScope = orgClasses.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) {
      setErrorMsg("Sélectionnez une organisation.");
      return;
    }
    if (scope === "class" && !classId) {
      setErrorMsg("Sélectionnez une classe.");
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);

    const content: AnnotationContent = {};
    if (title.trim()) content.title = title.trim();
    if (notes.trim()) content.notes = notes.trim();

    try {
      if (editor.kind === "new") {
        const res = await fetch("/api/teacher/annotations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organization_id: orgId,
            exercise_slug: exerciseSlug,
            locale: "fr",
            content,
            visibility_scope: scope,
            scope_id: scope === "class" ? classId : null,
            // Sprint E.4 — ancrage paragraphe (NULL pour "general").
            section_target: sectionTarget === "general" ? null : sectionTarget,
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setErrorMsg(body.details?.message ?? body.error ?? `HTTP ${res.status}`);
          setSubmitting(false);
          return;
        }
        const created = (await res.json()) as AnnotationRow;
        setAnnotations((prev) => [created, ...prev]);
        setEditor({ kind: "editing", annotationId: created.id });
      } else {
        const res = await fetch(
          `/api/teacher/annotations/${editor.annotationId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content,
              visibility_scope: scope,
              scope_id: scope === "class" ? classId : null,
              section_target: sectionTarget === "general" ? null : sectionTarget,
            }),
          },
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setErrorMsg(body.details?.message ?? body.error ?? `HTTP ${res.status}`);
          setSubmitting(false);
          return;
        }
        const updated = (await res.json()) as AnnotationRow;
        setAnnotations((prev) =>
          prev.map((a) => (a.id === updated.id ? updated : a)),
        );
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erreur réseau");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette annotation ? Elle sera archivée.")) return;
    const res = await fetch(`/api/teacher/annotations/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      alert(body.details?.message ?? body.error ?? `HTTP ${res.status}`);
      return;
    }
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
    if (editor.kind === "editing" && editor.annotationId === id) {
      setEditor({ kind: "new" });
    }
  };

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <button
          type="button"
          onClick={() => setEditor({ kind: "new" })}
          className={styles.newBtn}
        >
          + Nouvelle annotation
        </button>

        {annotations.length === 0 ? (
          <p className={styles.emptySidebar}>
            Aucune annotation pour cet exercice.
          </p>
        ) : (
          <ul className={styles.annotationList}>
            {annotations.map((a) => {
              const c = (a.content as AnnotationContent) ?? {};
              const active =
                editor.kind === "editing" && editor.annotationId === a.id;
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => setEditor({ kind: "editing", annotationId: a.id })}
                    className={active ? `${styles.annItem} ${styles.annItemActive}` : styles.annItem}
                  >
                    <span className={styles.annBadges}>
                      <ScopeBadge scope={a.visibility_scope as VisibilityScope} />
                      <span className={styles.annDate}>
                        {a.created_at
                          ? new Date(a.created_at).toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "short",
                            })
                          : ""}
                      </span>
                    </span>
                    {c.title && <strong className={styles.annTitle}>{c.title}</strong>}
                    {c.notes && (
                      <span className={styles.annExcerpt}>
                        {c.notes.slice(0, 60)}
                        {c.notes.length > 60 ? "…" : ""}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </aside>

      <section className={styles.editor}>
        <header className={styles.exoPreview}>
          <h1 className={styles.exoTitle}>{exerciseTitle}</h1>
          <p className={styles.exoMeta}>
            {exerciseLevel ? `${exerciseLevel} · ` : ""}
            {exerciseMuscles.slice(0, 3).join(" · ") || "—"}
          </p>
        </header>

        <form onSubmit={handleSubmit} className={styles.form}>
          <h2 className={styles.formTitle}>
            {editor.kind === "new" ? "Nouvelle annotation" : "Modifier l'annotation"}
          </h2>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="ann-org">
              Organisation
            </label>
            <select
              id="ann-org"
              className={styles.select}
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
              disabled={submitting || organizations.length === 1}
            >
              {organizations.length === 0 ? (
                <option value="">Aucune organisation</option>
              ) : (
                organizations.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="ann-scope">
              Visibilité
            </label>
            <select
              id="ann-scope"
              className={styles.select}
              value={scope}
              onChange={(e) => {
                const next = e.target.value as VisibilityScope;
                setScope(next);
                if (next !== "class") setClassId("");
              }}
              disabled={submitting}
            >
              <option value="private">Privée (moi seul)</option>
              <option value="school">Établissement (tous les profs)</option>
              <option value="class" disabled={!canPickClassScope}>
                Classe spécifique{canPickClassScope ? "" : " (aucune classe disponible)"}
              </option>
            </select>
          </div>

          {scope === "class" && (
            <div className={styles.field}>
              <label className={styles.label} htmlFor="ann-class">
                Classe
              </label>
              <select
                id="ann-class"
                className={styles.select}
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                disabled={submitting}
              >
                <option value="">— Choisir une classe —</option>
                {orgClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label} htmlFor="ann-section-target">
              Cette annotation concerne :
            </label>
            <select
              id="ann-section-target"
              className={styles.select}
              value={sectionTarget}
              onChange={(e) =>
                setSectionTarget(e.target.value as SectionTarget)
              }
              disabled={submitting}
            >
              {SECTION_TARGET_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="ann-title">
              Titre (optionnel)
            </label>
            <input
              id="ann-title"
              type="text"
              className={styles.input}
              placeholder="Ex. Mise en garde — dos plat"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              disabled={submitting}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="ann-notes">
              Notes pédagogiques
            </label>
            <textarea
              id="ann-notes"
              className={styles.textarea}
              placeholder="Consignes, variantes, points d'attention…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={5000}
              rows={8}
              disabled={submitting}
            />
            <span className={styles.charCount}>{notes.length} / 5000</span>
          </div>

          {errorMsg && <p className={styles.errorBox}>{errorMsg}</p>}

          <div className={styles.actions}>
            {editor.kind === "editing" && (
              <button
                type="button"
                onClick={() => handleDelete(editor.annotationId)}
                className={styles.deleteBtn}
                disabled={submitting}
              >
                Supprimer
              </button>
            )}
            <button
              type="button"
              onClick={() => setEditor({ kind: "new" })}
              className={styles.cancelBtn}
              disabled={submitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              className={styles.saveBtn}
              disabled={submitting || (!title.trim() && !notes.trim())}
            >
              {submitting ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function ScopeBadge({ scope }: { scope: VisibilityScope }) {
  const labels: Record<VisibilityScope, string> = {
    private: "Privée",
    class: "Classe",
    school: "Étabt",
  };
  const colors: Record<VisibilityScope, string> = {
    private: "#7b2fff",
    class: "#00e5ff",
    school: "#ff8c00",
  };
  return (
    <span className={styles.scopeBadge} style={{ color: colors[scope], borderColor: colors[scope] }}>
      {labels[scope]}
    </span>
  );
}
