"use client";

// Phase E.2.3.7 — UI interactive /mes-annotations : filtres + pagination.

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./mes-annotations.module.css";

type VisibilityScope = "private" | "class" | "school";

type EnrichedAnnotation = {
  id: string;
  exercise_slug: string;
  exercise_title: string;
  visibility_scope: string;
  scope_id: string | null;
  class_name: string | null;
  content: unknown;
  created_at: string | null;
};

type Props = {
  annotations: EnrichedAnnotation[];
  totalCount: number;
  pageSize: number;
  currentPage: number;
};

const SCOPE_LABELS: Record<VisibilityScope, string> = {
  private: "Privée",
  class: "Classe",
  school: "Établt",
};
const SCOPE_COLORS: Record<VisibilityScope, string> = {
  private: "#7b2fff",
  class: "#00e5ff",
  school: "#ff8c00",
};

export default function MesAnnotationsClient({
  annotations,
  totalCount,
  pageSize,
  currentPage,
}: Props) {
  const router = useRouter();
  const [scopeFilter, setScopeFilter] = useState<VisibilityScope | "all">("all");
  const [slugFilter, setSlugFilter] = useState<string>("all");
  const [rows, setRows] = useState(annotations);

  // Liste unique des exercices annotés (pour le select)
  const uniqueExercises = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((r) => {
      if (!map.has(r.exercise_slug)) {
        map.set(r.exercise_slug, r.exercise_title);
      }
    });
    return Array.from(map, ([slug, title]) => ({ slug, title }));
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((a) => {
      if (scopeFilter !== "all" && a.visibility_scope !== scopeFilter) return false;
      if (slugFilter !== "all" && a.exercise_slug !== slugFilter) return false;
      return true;
    });
  }, [rows, scopeFilter, slugFilter]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette annotation ? Elle sera archivée.")) return;
    try {
      const res = await fetch(`/api/teacher/annotations/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        alert(body.details?.message ?? body.error ?? `HTTP ${res.status}`);
        return;
      }
      setRows((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur réseau");
    }
  };

  const goToPage = (p: number) => {
    router.push(`/mes-annotations?page=${p}`);
  };

  return (
    <>
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel} htmlFor="scope-filter">
            Visibilité
          </label>
          <select
            id="scope-filter"
            className={styles.filterSelect}
            value={scopeFilter}
            onChange={(e) =>
              setScopeFilter(e.target.value as VisibilityScope | "all")
            }
          >
            <option value="all">Toutes</option>
            <option value="private">Privée</option>
            <option value="class">Classe</option>
            <option value="school">Établissement</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel} htmlFor="slug-filter">
            Exercice
          </label>
          <select
            id="slug-filter"
            className={styles.filterSelect}
            value={slugFilter}
            onChange={(e) => setSlugFilter(e.target.value)}
          >
            <option value="all">Tous les exercices</option>
            {uniqueExercises.map((ex) => (
              <option key={ex.slug} value={ex.slug}>
                {ex.title}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.count}>
          {filtered.length} / {rows.length} sur cette page
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.emptyState}>
          {rows.length === 0 ? (
            <>
              <p className={styles.emptyTitle}>Aucune annotation encore</p>
              <p className={styles.emptyDesc}>
                Annotez des exercices depuis le catalogue.
              </p>
              <Link href="/exercices" className={styles.emptyCta}>
                Parcourir le catalogue
              </Link>
            </>
          ) : (
            <p className={styles.emptyDesc}>
              Aucune annotation ne correspond aux filtres actifs.
            </p>
          )}
        </div>
      ) : (
        <ul className={styles.list}>
          {filtered.map((a) => {
            const content = (a.content as { title?: string; notes?: string }) ?? {};
            const scope = a.visibility_scope as VisibilityScope;
            return (
              <li key={a.id} className={styles.row}>
                <div className={styles.rowMain}>
                  <div className={styles.rowHeader}>
                    <span
                      className={styles.scopeBadge}
                      style={{
                        color: SCOPE_COLORS[scope] ?? "#fff",
                        borderColor: SCOPE_COLORS[scope] ?? "#fff",
                      }}
                    >
                      {SCOPE_LABELS[scope] ?? scope}
                      {a.class_name ? ` · ${a.class_name}` : ""}
                    </span>
                    <Link
                      href={`/exercices/${a.exercise_slug}/annotations`}
                      className={styles.exoLink}
                    >
                      {a.exercise_title}
                    </Link>
                    <span className={styles.date}>
                      {a.created_at
                        ? new Date(a.created_at).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            year: "2-digit",
                          })
                        : ""}
                    </span>
                  </div>
                  {content.title && (
                    <strong className={styles.rowTitle}>{content.title}</strong>
                  )}
                  {content.notes && (
                    <p className={styles.rowExcerpt}>
                      {content.notes.slice(0, 180)}
                      {content.notes.length > 180 ? "…" : ""}
                    </p>
                  )}
                </div>
                <div className={styles.rowActions}>
                  <Link
                    href={`/exercices/${a.exercise_slug}/annotations?annotation_id=${a.id}`}
                    className={styles.editBtn}
                  >
                    Éditer
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(a.id)}
                    className={styles.deleteBtn}
                  >
                    Supprimer
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {totalPages > 1 && (
        <nav className={styles.pagination} aria-label="Pagination">
          <button
            type="button"
            className={styles.pageBtn}
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            ← Précédent
          </button>
          <span className={styles.pageInfo}>
            Page {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            className={styles.pageBtn}
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            Suivant →
          </button>
        </nav>
      )}
    </>
  );
}
