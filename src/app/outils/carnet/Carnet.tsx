"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Download, Printer, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { normalizeForSearch } from "@/lib/text/normalize";

/* ── Types ──────────────────────────────────────────────────────────── */

type CarnetExercice = {
  nom: string;
  charge: number;
  series: number;
  reps: number;
  rir: number;
  ressenti: number;
};

type CarnetExerciceState = CarnetExercice & { _id: string };

type CarnetEntry = {
  id: string;
  date: string;
  objectif: "endurance" | "volume" | "puissance";
  methodes: string[];
  exercices: CarnetExercice[];
  notes: string;
};

type ExerciceOption = {
  slug: string;
  title: string;
  themeCompatibility: number[];
  session: string;
};

type Props = {
  methodeNames: { slug: string; titre: string }[];
  exerciceNames: ExerciceOption[];
};

/* ── Constants ──────────────────────────────────────────────────────── */

const STORAGE_KEY = "tazieff-carnet";
const OBJECTIFS = ["endurance", "volume", "puissance"] as const;

const OBJECTIF_META: Record<string, { label: string; color: string }> = {
  endurance: { label: "Endurance", color: "#34d399" },
  volume: { label: "Volume", color: "#60a5fa" },
  puissance: { label: "Puissance", color: "#fb923c" },
};

const RESSENTI_EMOJIS = ["😩", "😐", "😊", "💪", "🔥"] as const;
const RESSENTI_LABELS = [
  "Très difficile",
  "Difficile",
  "Correct",
  "Bien",
  "Excellent",
] as const;

const METHODES_PAR_OBJECTIF: Record<string, string[]> = {
  endurance: [
    "charge-constante", "pyramide", "triple-tri-set", "circuit-training",
    "defi-centurion", "emom", "amrap",
  ],
  volume: [
    "aps", "super-set", "drop-set", "serie-brulante",
    "rest-pause", "pre-activation", "demi-pyramide",
  ],
  puissance: [
    "triple-tri-set", "double-progression", "methode-bulgare",
    "pliometrie", "stato-dynamique", "demi-pyramide-force",
  ],
};

const OBJECTIF_TO_THEME: Record<string, number> = {
  endurance: 1,
  volume: 2,
  puissance: 3,
};

const SESSION_NAMES: Record<string, string> = {
  S1: "Gainage statique",
  S2: "Gainage dynamique et abdominaux",
  S3: "Haut du corps",
  S4: "Bas du corps",
  S5: "Exercices fonctionnels",
  S6: "Étirements",
  S7: "Machines guidées",
};

const SESSION_ORDER = ["S1", "S2", "S3", "S4", "S5", "S6", "S7"];

/* ── Helpers ────────────────────────────────────────────────────────── */

function migrateExercice(ex: Record<string, unknown>): CarnetExercice {
  if ("seriesReps" in ex && !("series" in ex)) {
    const parts = String(ex.seriesReps ?? "").split(/[x×*]/i);
    return {
      nom: String(ex.nom ?? ""),
      charge: Number(ex.charge) || 0,
      series: parseInt(parts[0]) || 0,
      reps: parseInt(parts[1]) || 0,
      rir: Number(ex.rir) || 0,
      ressenti: Number(ex.ressenti) || 3,
    };
  }
  return {
    nom: String(ex.nom ?? ""),
    charge: Number(ex.charge) || 0,
    series: Number(ex.series) || 0,
    reps: Number(ex.reps) || 0,
    rir: Number(ex.rir) || 0,
    ressenti: Number(ex.ressenti) || 3,
  };
}

function loadEntries(): CarnetEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CarnetEntry[];
    return parsed.map((entry) => ({
      ...entry,
      exercices: entry.exercices.map((ex) =>
        migrateExercice(ex as unknown as Record<string, unknown>),
      ),
    }));
  } catch {
    return [];
  }
}

function saveEntries(entries: CarnetEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* ignore */
  }
}

function formatSeriesReps(ex: Record<string, unknown>): string {
  const s = Number(ex.series);
  const r = Number(ex.reps);
  if (s > 0 && r > 0) return `${s} × ${r}`;
  if (typeof ex.seriesReps === "string" && ex.seriesReps) return String(ex.seriesReps);
  return "–";
}

function newExercice(): CarnetExerciceState {
  return {
    _id: crypto.randomUUID(),
    nom: "",
    charge: 0,
    series: 0,
    reps: 0,
    rir: 2,
    ressenti: 3,
  };
}

/* ── ExerciceSelector (grouped by session) ─────────────────────────── */

type SessionGroup = { session: string; label: string; exercises: ExerciceOption[] };

function ExerciceSelector({
  value,
  options,
  objectif,
  onChange,
}: {
  value: string;
  options: ExerciceOption[];
  objectif: string;
  onChange: (title: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [othersExpanded, setOthersExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useRef(`cb-${crypto.randomUUID().slice(0, 8)}`).current;

  const isSearching = query.length > 0;
  const themeNum = OBJECTIF_TO_THEME[objectif];

  // Flat search results
  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    const norm = normalizeForSearch(query);
    return options
      .filter((o) => normalizeForSearch(o.title).includes(norm))
      .slice(0, 12);
  }, [query, options, isSearching]);

  // Grouped by session
  const { matchingGroups, otherGroups } = useMemo((): {
    matchingGroups: SessionGroup[];
    otherGroups: SessionGroup[];
  } => {
    if (isSearching) return { matchingGroups: [], otherGroups: [] };

    const buildGroups = (list: ExerciceOption[]): SessionGroup[] =>
      SESSION_ORDER
        .map((s) => ({
          session: s,
          label: SESSION_NAMES[s] || s,
          exercises: list.filter((o) => o.session === s),
        }))
        .filter((g) => g.exercises.length > 0);

    if (!themeNum) {
      return { matchingGroups: buildGroups(options), otherGroups: [] };
    }

    const matching: ExerciceOption[] = [];
    const others: ExerciceOption[] = [];
    for (const o of options) {
      if (o.themeCompatibility.includes(themeNum)) matching.push(o);
      else others.push(o);
    }
    return { matchingGroups: buildGroups(matching), otherGroups: buildGroups(others) };
  }, [options, themeNum, isSearching]);

  // Flat list for keyboard nav
  const flatItems = useMemo(() => {
    if (isSearching) return searchResults;
    const items: ExerciceOption[] = [];
    for (const g of matchingGroups) items.push(...g.exercises);
    if (othersExpanded) {
      for (const g of otherGroups) items.push(...g.exercises);
    }
    return items;
  }, [isSearching, searchResults, matchingGroups, otherGroups, othersExpanded]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    setActiveIndex(-1);
  }, [query, objectif]);

  // Reset "others" collapsed when objectif changes
  useEffect(() => {
    setOthersExpanded(false);
  }, [objectif]);

  const select = (title: string) => {
    onChange(title);
    setQuery("");
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "ArrowDown") { setOpen(true); e.preventDefault(); }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((p) => Math.min(p + 1, flatItems.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((p) => Math.max(p - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && flatItems[activeIndex]) select(flatItems[activeIndex].title);
        break;
      case "Escape":
        setOpen(false);
        break;
    }
  };

  const sessionBadge = useMemo(() => {
    if (!value) return null;
    const match = options.find((o) => o.title === value);
    return match ? match.session : null;
  }, [value, options]);

  if (value) {
    return (
      <div className="carnet-combo-selected">
        <span className="carnet-combo-badge">
          {value}
          {sessionBadge && (
            <span className="carnet-session-badge">{sessionBadge}</span>
          )}
        </span>
        <button
          type="button"
          className="carnet-combo-clear"
          onClick={() => onChange("")}
          aria-label="Effacer la sélection"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      </div>
    );
  }

  const hasContent = isSearching ? searchResults.length > 0 : matchingGroups.length > 0 || otherGroups.length > 0;

  return (
    <div
      ref={containerRef}
      className="carnet-combo"
      role="combobox"
      aria-expanded={open}
      aria-haspopup="listbox"
      aria-owns={listId}
    >
      <div className="carnet-combo-input-wrap">
        <svg viewBox="0 0 20 20" fill="currentColor" className="carnet-combo-icon" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
            clipRule="evenodd"
          />
        </svg>
        <input
          type="text"
          className="carnet-input carnet-combo-input"
          placeholder="Rechercher un exercice..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          aria-autocomplete="list"
          aria-controls={listId}
          aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        />
      </div>
      {open && hasContent && (
        <div
          ref={listRef}
          id={listId}
          className="carnet-combo-list carnet-selector-list"
          role="listbox"
        >
          {isSearching ? (
            searchResults.map((opt, i) => (
              <div
                key={opt.slug}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === activeIndex}
                className={`carnet-selector-item${i === activeIndex ? " active" : ""}`}
                onMouseDown={(e) => { e.preventDefault(); select(opt.title); }}
                onMouseEnter={() => setActiveIndex(i)}
              >
                {opt.title}
                <span className="carnet-session-badge-sm">{opt.session}</span>
              </div>
            ))
          ) : (
            <>
              {matchingGroups.map((group) => (
                <div key={group.session}>
                  <div className="carnet-session-header">
                    {group.session} — {group.label} ({group.exercises.length})
                  </div>
                  {group.exercises.map((ex) => {
                    const idx = flatItems.indexOf(ex);
                    return (
                      <div
                        key={ex.slug}
                        id={`${listId}-${idx}`}
                        role="option"
                        aria-selected={idx === activeIndex}
                        className={`carnet-selector-item${idx === activeIndex ? " active" : ""}`}
                        onMouseDown={(e) => { e.preventDefault(); select(ex.title); }}
                        onMouseEnter={() => setActiveIndex(idx)}
                      >
                        {ex.title}
                      </div>
                    );
                  })}
                </div>
              ))}
              {otherGroups.length > 0 && (
                <div className="carnet-others-section">
                  <button
                    type="button"
                    className="carnet-others-toggle"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setOthersExpanded((p) => !p);
                    }}
                  >
                    {othersExpanded ? "▾ Autres exercices" : "▸ Autres exercices"}
                  </button>
                  {othersExpanded && otherGroups.map((group) => (
                    <div key={group.session}>
                      <div className="carnet-session-header">
                        {group.session} — {group.label} ({group.exercises.length})
                      </div>
                      {group.exercises.map((ex) => {
                        const idx = flatItems.indexOf(ex);
                        return (
                          <div
                            key={ex.slug}
                            id={`${listId}-${idx}`}
                            role="option"
                            aria-selected={idx === activeIndex}
                            className={`carnet-selector-item${idx === activeIndex ? " active" : ""}`}
                            onMouseDown={(e) => { e.preventDefault(); select(ex.title); }}
                            onMouseEnter={() => setActiveIndex(idx)}
                          >
                            {ex.title}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────────── */

export function Carnet({ methodeNames, exerciceNames }: Props) {
  const { t } = useI18n();
  const [tab, setTab] = useState<"form" | "history">("form");
  const [entries, setEntries] = useState<CarnetEntry[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form state
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [objectif, setObjectif] = useState<CarnetEntry["objectif"]>("endurance");
  const [selectedMethodes, setSelectedMethodes] = useState<string[]>([]);
  const [exercices, setExercices] = useState<CarnetExerciceState[]>([newExercice()]);
  const [notes, setNotes] = useState("");

  // Animation states
  const [newCardIds, setNewCardIds] = useState<Set<string>>(new Set());
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "done">("idle");
  const [methodesFading, setMethodesFading] = useState(false);
  const prevObjectifRef = useRef(objectif);

  // Tab indicator
  const tabsRef = useRef<HTMLDivElement>(null);
  const formTabRef = useRef<HTMLButtonElement>(null);
  const historyTabRef = useRef<HTMLButtonElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    setEntries(loadEntries());
  }, []);

  useEffect(() => {
    const el = tab === "form" ? formTabRef.current : historyTabRef.current;
    if (el && tabsRef.current) {
      const parentRect = tabsRef.current.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      setIndicatorStyle({ left: elRect.left - parentRect.left, width: elRect.width });
    }
  }, [tab]);

  // Methods filtered by objectif
  const filteredMethodes = useMemo(() => {
    const allowed = METHODES_PAR_OBJECTIF[objectif];
    if (!allowed) return methodeNames;
    const set = new Set(allowed);
    return methodeNames.filter((m) => set.has(m.slug));
  }, [methodeNames, objectif]);

  // Deselect methods not in new objectif + fade animation
  useEffect(() => {
    if (prevObjectifRef.current !== objectif) {
      setMethodesFading(true);
      const allowed = new Set(METHODES_PAR_OBJECTIF[objectif] ?? []);
      setSelectedMethodes((prev) => prev.filter((s) => allowed.has(s)));
      const timer = setTimeout(() => setMethodesFading(false), 150);
      prevObjectifRef.current = objectif;
      return () => clearTimeout(timer);
    }
  }, [objectif]);

  /* ── Handlers ──────────────────────────────────────────────────────── */

  const toggleMethode = useCallback((slug: string) => {
    setSelectedMethodes((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  }, []);

  const updateExercice = useCallback(
    (id: string, field: keyof CarnetExercice, value: string | number) => {
      setExercices((prev) =>
        prev.map((ex) => (ex._id === id ? { ...ex, [field]: value } : ex)),
      );
    },
    [],
  );

  const addExercice = useCallback(() => {
    const ex = newExercice();
    setExercices((prev) => [...prev, ex]);
    setNewCardIds((prev) => new Set(prev).add(ex._id));
    setTimeout(() => {
      setNewCardIds((prev) => {
        const next = new Set(prev);
        next.delete(ex._id);
        return next;
      });
    }, 350);
  }, []);

  const removeExercice = useCallback((id: string) => {
    setRemovingId(id);
    setTimeout(() => {
      setExercices((prev) => prev.filter((ex) => ex._id !== id));
      setRemovingId(null);
    }, 250);
  }, []);

  const resetForm = useCallback(() => {
    setDate(new Date().toISOString().slice(0, 10));
    setObjectif("endurance");
    setSelectedMethodes([]);
    setExercices([newExercice()]);
    setNotes("");
  }, []);

  const saveEntry = useCallback(() => {
    if (saveState !== "idle") return;
    setSaveState("saving");
    setTimeout(() => {
      const entry: CarnetEntry = {
        id: crypto.randomUUID(),
        date,
        objectif,
        methodes: selectedMethodes,
        exercices: exercices.filter((e) => e.nom.trim()).map(({ _id, ...rest }) => rest),
        notes,
      };
      const next = [entry, ...entries];
      setEntries(next);
      saveEntries(next);
      setSaveState("done");
      setTimeout(() => {
        resetForm();
        setSaveState("idle");
        setTab("history");
      }, 1500);
    }, 400);
  }, [saveState, date, objectif, selectedMethodes, exercices, notes, entries, resetForm]);

  const deleteEntry = useCallback(
    (id: string) => {
      const next = entries.filter((e) => e.id !== id);
      setEntries(next);
      saveEntries(next);
    },
    [entries],
  );

  const exportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `carnet-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [entries]);

  /* ── Live summary ───────────────────────────────────────────────────── */

  const summary = useMemo(() => {
    const exCount = exercices.filter((e) => e.nom.trim()).length;
    const parts: string[] = [];
    if (exCount > 0) parts.push(`${exCount} exercice${exCount > 1 ? "s" : ""}`);
    parts.push(OBJECTIF_META[objectif]?.label ?? objectif);
    const labels = selectedMethodes
      .map((slug) => methodeNames.find((m) => m.slug === slug)?.titre)
      .filter(Boolean);
    if (labels.length > 0) parts.push(labels.join(", "));
    return parts.join(" · ");
  }, [exercices, objectif, selectedMethodes, methodeNames]);

  const objectifLabels: Record<string, string> = {
    endurance: t("carnet.objectifEndurance"),
    volume: t("carnet.objectifVolume"),
    puissance: t("carnet.objectifPuissance"),
  };

  /* ── Render ──────────────────────────────────────────────────────────── */

  return (
    <div>
      {/* Tabs */}
      <div ref={tabsRef} className="carnet-tabs">
        <button
          ref={formTabRef}
          type="button"
          className={`carnet-tab ${tab === "form" ? "active" : ""}`}
          onClick={() => setTab("form")}
        >
          Nouvelle séance
        </button>
        <button
          ref={historyTabRef}
          type="button"
          className={`carnet-tab ${tab === "history" ? "active" : ""}`}
          onClick={() => setTab("history")}
        >
          Historique ({entries.length})
        </button>
        <div
          className="carnet-tab-indicator"
          style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
        />
      </div>

      {/* ── Form ─────────────────────────────────────────────────────── */}
      {tab === "form" && (
        <div className="carnet-form">
          {/* Date */}
          <label className="carnet-field">
            <span className="carnet-label">{t("carnet.date")}</span>
            <input
              type="date"
              className="carnet-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>

          {/* Objectif chips */}
          <fieldset className="carnet-field">
            <legend className="carnet-label">{t("carnet.objectif")}</legend>
            <div className="flex gap-2 flex-wrap">
              {OBJECTIFS.map((o) => {
                const meta = OBJECTIF_META[o];
                const isActive = objectif === o;
                return (
                  <button
                    key={o}
                    type="button"
                    className={`carnet-obj-chip ${isActive ? "active" : ""}`}
                    style={{ "--chip-color": meta.color } as React.CSSProperties}
                    onClick={() => setObjectif(o)}
                  >
                    {objectifLabels[o]}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Méthodes (filtered by objectif) */}
          <fieldset className="carnet-field">
            <legend className="carnet-label">{t("carnet.methodes")}</legend>
            <div
              className="flex gap-2 flex-wrap"
              style={{
                opacity: methodesFading ? 0 : 1,
                transition: methodesFading ? "opacity 150ms" : "opacity 200ms",
              }}
            >
              {filteredMethodes.map((m) => (
                <button
                  key={m.slug}
                  type="button"
                  className={`carnet-methode ${selectedMethodes.includes(m.slug) ? "active" : ""}`}
                  onClick={() => toggleMethode(m.slug)}
                >
                  {m.titre}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Exercices */}
          <fieldset className="carnet-field">
            <legend className="carnet-label">{t("carnet.exercices")}</legend>
            <div className="carnet-cards">
              {exercices.map((ex) => {
                const isNew = newCardIds.has(ex._id);
                const isRemoving = removingId === ex._id;
                return (
                  <div
                    key={ex._id}
                    className={`carnet-card${isNew ? " carnet-card-enter" : ""}${isRemoving ? " carnet-card-exit" : ""}`}
                  >
                    {exercices.length > 1 && !isRemoving && (
                      <button
                        type="button"
                        className="carnet-card-del"
                        onClick={() => removeExercice(ex._id)}
                        aria-label="Supprimer cet exercice"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-4 h-4"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}

                    {/* Row 1: Exercise selector */}
                    <ExerciceSelector
                      value={ex.nom}
                      options={exerciceNames}
                      objectif={objectif}
                      onChange={(title) => updateExercice(ex._id, "nom", title)}
                    />

                    {/* Row 2: Charge + Séries × Reps */}
                    <div className="carnet-row2">
                      <div className="carnet-fcol">
                        <span className="carnet-flabel">Charge (kg)</span>
                        <input
                          type="number"
                          inputMode="decimal"
                          className="carnet-input"
                          placeholder="0"
                          value={ex.charge || ""}
                          onChange={(e) => updateExercice(ex._id, "charge", Number(e.target.value))}
                          min={0}
                        />
                      </div>
                      <div className="carnet-sxr">
                        <div className="carnet-fcol">
                          <span className="carnet-flabel">Séries</span>
                          <input
                            type="number"
                            inputMode="numeric"
                            className="carnet-input"
                            placeholder="4"
                            value={ex.series || ""}
                            onChange={(e) =>
                              updateExercice(ex._id, "series", Number(e.target.value))
                            }
                            min={1}
                            max={20}
                          />
                        </div>
                        <span className="carnet-multiply">×</span>
                        <div className="carnet-fcol">
                          <span className="carnet-flabel">Reps</span>
                          <input
                            type="number"
                            inputMode="numeric"
                            className="carnet-input"
                            placeholder="10"
                            value={ex.reps || ""}
                            onChange={(e) =>
                              updateExercice(ex._id, "reps", Number(e.target.value))
                            }
                            min={1}
                            max={100}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Row 3: RIR + Ressenti */}
                    <div className="carnet-row3">
                      <div className="carnet-fcol">
                        <span className="carnet-flabel">RIR</span>
                        <input
                          type="number"
                          inputMode="numeric"
                          className="carnet-input carnet-rir"
                          value={ex.rir}
                          onChange={(e) => updateExercice(ex._id, "rir", Number(e.target.value))}
                          min={0}
                          max={5}
                        />
                      </div>
                      <div className="carnet-fcol" style={{ flex: 1 }}>
                        <span className="carnet-flabel">Ressenti</span>
                        <div className="carnet-emojis-wrap"><div className="carnet-emojis">
                          {RESSENTI_EMOJIS.map((emoji, i) => {
                            const val = i + 1;
                            const isSelected = ex.ressenti === val;
                            return (
                              <button
                                key={val}
                                type="button"
                                className={`carnet-emoji${isSelected ? " selected" : ""}`}
                                onClick={() => updateExercice(ex._id, "ressenti", val)}
                                aria-label={`Ressenti : ${RESSENTI_LABELS[i]}`}
                              >
                                {emoji}
                              </button>
                            );
                          })}
                        </div></div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Add exercise */}
              <button type="button" className="carnet-add" onClick={addExercice}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="w-5 h-5"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Ajouter un exercice
              </button>
            </div>
          </fieldset>

          {/* Notes */}
          <label className="carnet-field">
            <span className="carnet-label">{t("carnet.notes")}</span>
            <textarea
              className="carnet-input"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("carnet.notesPlaceholder")}
            />
          </label>

          {/* Live summary */}
          <div className="carnet-summary">
            <svg viewBox="0 0 20 20" fill="currentColor" className="carnet-summary-icon" aria-hidden="true">
              <path d="M15.5 2A1.5 1.5 0 0 0 14 3.5v13a1.5 1.5 0 0 0 1.5 1.5h1a1.5 1.5 0 0 0 1.5-1.5v-13A1.5 1.5 0 0 0 16.5 2h-1ZM9.5 6A1.5 1.5 0 0 0 8 7.5v9A1.5 1.5 0 0 0 9.5 18h1a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 10.5 6h-1ZM3.5 10A1.5 1.5 0 0 0 2 11.5v5A1.5 1.5 0 0 0 3.5 18h1A1.5 1.5 0 0 0 6 16.5v-5A1.5 1.5 0 0 0 4.5 10h-1Z" />
            </svg>
            <span>{summary}</span>
          </div>

          {/* Save button */}
          <button
            type="button"
            className={`carnet-save ${saveState}`}
            onClick={saveEntry}
            disabled={saveState !== "idle"}
          >
            {saveState === "idle" && t("carnet.save")}
            {saveState === "saving" && <span className="carnet-spinner" />}
            {saveState === "done" && (
              <>
                <svg
                  className="carnet-check"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Séance enregistrée !
              </>
            )}
          </button>
        </div>
      )}

      {/* ── History ──────────────────────────────────────────────────── */}
      {tab === "history" && (
        <div className="stack-md">
          {entries.length === 0 ? (
            <div className="carnet-empty">
              <span className="carnet-empty-emoji">🏋️</span>
              <h2 className="carnet-empty-title">Prêt pour ta première séance ?</h2>
              <p className="carnet-empty-sub">
                Remplis le formulaire ci-dessus et commence ton parcours.
              </p>
              <button
                type="button"
                className="carnet-empty-cta"
                onClick={() => {
                  setTab("form");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Commencer
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-2 flex-wrap">
                <button type="button" className="pill" onClick={exportJson}>
                  <Download size={14} /> {t("carnet.exportJson")}
                </button>
                <button type="button" className="pill" onClick={() => window.print()}>
                  <Printer size={14} /> {t("carnet.print")}
                </button>
              </div>

              {entries.map((entry) => {
                const isExpanded = expandedId === entry.id;
                return (
                  <div key={entry.id} className="card">
                    <button
                      type="button"
                      className="carnet-history-header"
                      onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-[color:var(--ink)]">{entry.date}</span>
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                          style={{
                            background: `color-mix(in srgb, ${OBJECTIF_META[entry.objectif]?.color || "var(--accent)"} 15%, transparent)`,
                            color: OBJECTIF_META[entry.objectif]?.color || "var(--accent)",
                          }}
                        >
                          {objectifLabels[entry.objectif]}
                        </span>
                        <span className="text-xs text-[color:var(--muted)]">
                          {entry.exercices.length} exos
                        </span>
                      </div>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {isExpanded && (
                      <div className="carnet-history-body">
                        {entry.methodes.length > 0 && (
                          <p className="text-xs text-[color:var(--muted)]">
                            {t("carnet.methodes")}: {entry.methodes.join(", ")}
                          </p>
                        )}
                        <table className="carnet-table">
                          <thead>
                            <tr>
                              <th>{t("carnet.exerciceCol")}</th>
                              <th>{t("carnet.charge")}</th>
                              <th>Séries × Reps</th>
                              <th>RIR</th>
                              <th>{t("carnet.ressenti")}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {entry.exercices.map((ex, i) => (
                              <tr key={i}>
                                <td>{ex.nom}</td>
                                <td>{ex.charge ? `${ex.charge} kg` : "–"}</td>
                                <td>
                                  {formatSeriesReps(ex as unknown as Record<string, unknown>)}
                                </td>
                                <td>{ex.rir}</td>
                                <td>
                                  {RESSENTI_EMOJIS[Math.max(0, Math.min(4, ex.ressenti - 1))]}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {entry.notes && (
                          <p className="text-sm text-[color:var(--muted)] mt-2">{entry.notes}</p>
                        )}
                        <button
                          type="button"
                          className="carnet-delete-btn"
                          onClick={() => deleteEntry(entry.id)}
                        >
                          <Trash2 size={14} /> {t("carnet.delete")}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
