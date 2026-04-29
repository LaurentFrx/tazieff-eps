// Sprint E.3 (28 avril 2026) — panneau d'édition admin pour les liens
// `methodes_compatibles` et `exercices_similaires` du frontmatter override.
//
// Composant autonome utilisé en mode admin sur la fiche d'exercice. Charge
// le catalogue local des slugs disponibles via `/api/catalog/slugs` et offre
// deux multi-selects à recherche.
//
// Persistance via le callback parent (`handleFrontmatterPatchSave`) qui
// alimente `overrideDoc.doc.frontmatterPatch.methodes_compatibles` et
// `.exercices_similaires`. Côté lecture, `applyExercisePatch()` fusionne ce
// patch dans `merged.frontmatter`, donc aucun changement nécessaire au rendu
// élève.

"use client";

import { useEffect, useMemo, useState } from "react";

import { useI18n } from "@/lib/i18n/I18nProvider";

export type CatalogSlugOption = {
  slug: string;
  title: string;
};

export type CatalogSlugsPayload = {
  exercices: CatalogSlugOption[];
  methodes: CatalogSlugOption[];
};

export type LinksPanelProps = {
  methodesValue: string[];
  exercicesValue: string[];
  onChangeMethodes: (next: string[]) => Promise<void> | void;
  onChangeExercices: (next: string[]) => Promise<void> | void;
  /** Override pour les tests : contourne le fetch HTTP. */
  initialCatalog?: CatalogSlugsPayload;
};

export default function LinksPanel({
  methodesValue,
  exercicesValue,
  onChangeMethodes,
  onChangeExercices,
  initialCatalog,
}: LinksPanelProps) {
  const { t } = useI18n();
  const [catalog, setCatalog] = useState<CatalogSlugsPayload | null>(
    initialCatalog ?? null,
  );
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    // Mode test : le catalogue est injecté en prop, useState l'a déjà comme
    // valeur initiale. Pas de fetch, pas de setState dans l'effect.
    if (initialCatalog) {
      return;
    }
    let cancelled = false;
    fetch("/api/catalog/slugs", { cache: "force-cache" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setCatalog(data as CatalogSlugsPayload);
      })
      .catch(() => {
        if (!cancelled) setLoadError(t("exerciseEditor.catalogLoadError"));
      });
    return () => {
      cancelled = true;
    };
  }, [initialCatalog, t]);

  return (
    <div
      className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4"
      data-testid="links-panel"
    >
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300/70">
        {t("exerciseEditor.linksPanelTitle")}
      </p>
      <p className="mb-3 text-xs text-white/50">
        {t("exerciseEditor.linksPanelDesc")}
      </p>

      {loadError ? (
        <p className="text-xs text-red-400" role="alert">
          {loadError}
        </p>
      ) : null}

      {catalog ? (
        <div className="stack-md">
          <SlugMultiSelect
            label={t("exerciseEditor.methodesCompatiblesLabel")}
            description={t("exerciseEditor.methodesCompatiblesDesc")}
            options={catalog.methodes}
            value={methodesValue}
            onChange={onChangeMethodes}
            ariaLabel={t("exerciseEditor.editMethodesAriaLabel")}
            emptyText={t("exerciseEditor.noMethodeSelected")}
            testId="links-panel-methodes"
          />
          <SlugMultiSelect
            label={t("exerciseEditor.exercicesSimilairesLabel")}
            description={t("exerciseEditor.exercicesSimilairesDesc")}
            options={catalog.exercices}
            value={exercicesValue}
            onChange={onChangeExercices}
            ariaLabel={t("exerciseEditor.editExercicesAriaLabel")}
            emptyText={t("exerciseEditor.noExerciceSimilarSelected")}
            testId="links-panel-exercices"
          />
        </div>
      ) : !loadError ? (
        <p className="text-xs text-white/40">…</p>
      ) : null}
    </div>
  );
}

type SlugMultiSelectProps = {
  label: string;
  description: string;
  ariaLabel: string;
  options: CatalogSlugOption[];
  value: string[];
  onChange: (next: string[]) => Promise<void> | void;
  emptyText: string;
  testId: string;
};

function SlugMultiSelect({
  label,
  description,
  ariaLabel,
  options,
  value,
  onChange,
  emptyText,
  testId,
}: SlugMultiSelectProps) {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return options;
    return options.filter(
      (opt) =>
        opt.slug.toLowerCase().includes(needle) ||
        opt.title.toLowerCase().includes(needle),
    );
  }, [options, search]);

  const titleBySlug = useMemo(() => {
    const map = new Map<string, string>();
    for (const opt of options) map.set(opt.slug, opt.title);
    return map;
  }, [options]);

  const toggle = (slug: string) => {
    const next = value.includes(slug)
      ? value.filter((s) => s !== slug)
      : [...value, slug];
    return onChange(next);
  };

  return (
    <div className="stack-sm">
      <label className="text-xs font-semibold uppercase tracking-[0.15em] text-white/60">
        {label}
      </label>
      <p className="text-[11px] text-white/40">{description}</p>

      <div
        className="flex flex-wrap gap-2"
        role="list"
        data-testid={`${testId}-pills`}
      >
        {value.length === 0 ? (
          <span className="text-xs text-white/40">{emptyText}</span>
        ) : (
          value.map((slug) => {
            const title = titleBySlug.get(slug) ?? slug;
            return (
              <span
                key={slug}
                className="pill inline-flex items-center gap-2"
                role="listitem"
              >
                {title}
                <button
                  type="button"
                  className="text-xs text-white/50 hover:text-white"
                  aria-label={`${t("exerciseEditor.delete")} ${title}`}
                  onClick={() => toggle(slug)}
                  data-testid={`${testId}-remove-${slug}`}
                >
                  ×
                </button>
              </span>
            );
          })
        )}
      </div>

      <button
        type="button"
        className="chip self-start"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        data-testid={`${testId}-toggle`}
      >
        {isOpen ? t("exerciseEditor.close") : t("exerciseEditor.add")} ▾
      </button>

      {isOpen ? (
        <div className="rounded-2xl border border-white/10 bg-[color:var(--bg-2)] p-2">
          <input
            type="text"
            className="field-input mb-2"
            placeholder={t("exerciseEditor.searchPlaceholder")}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            data-testid={`${testId}-search`}
          />
          <div
            className="max-h-48 space-y-1 overflow-y-auto"
            data-testid={`${testId}-options`}
          >
            {filtered.length === 0 ? (
              <p className="text-xs text-white/40">—</p>
            ) : (
              filtered.map((opt) => {
                const checked = value.includes(opt.slug);
                return (
                  <label
                    key={opt.slug}
                    className="flex min-h-[36px] items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-white/10"
                    data-testid={`${testId}-option-${opt.slug}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(opt.slug)}
                    />
                    <span className="flex-1">{opt.title}</span>
                    <code className="text-[10px] text-white/40">{opt.slug}</code>
                  </label>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
