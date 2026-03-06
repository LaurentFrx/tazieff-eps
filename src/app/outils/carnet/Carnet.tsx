"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Download, Plus, Printer, Trash2, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

/* ── Types ──────────────────────────────────────────────────────────── */

type CarnetExercice = {
  nom: string;
  charge: number;
  seriesReps: string;
  rir: number;
  ressenti: number;
};

type CarnetEntry = {
  id: string;
  date: string;
  objectif: "endurance" | "volume" | "puissance";
  methodes: string[];
  exercices: CarnetExercice[];
  notes: string;
};

type Props = {
  methodeNames: { slug: string; titre: string }[];
  exerciceNames: { slug: string; title: string }[];
};

const STORAGE_KEY = "tazieff-carnet";
const OBJECTIFS = ["endurance", "volume", "puissance"] as const;

const OBJECTIF_COLORS: Record<string, string> = {
  endurance: "#34d399",
  volume: "#60a5fa",
  puissance: "#fb923c",
};

function loadEntries(): CarnetEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CarnetEntry[]) : [];
  } catch {
    return [];
  }
}

function saveEntries(entries: CarnetEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch { /* ignore */ }
}

/* ── Component ──────────────────────────────────────────────────────── */

export function Carnet({ methodeNames, exerciceNames }: Props) {
  const { t } = useI18n();
  const [tab, setTab] = useState<"form" | "history">("form");
  const [entries, setEntries] = useState<CarnetEntry[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form state
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [objectif, setObjectif] = useState<CarnetEntry["objectif"]>("endurance");
  const [selectedMethodes, setSelectedMethodes] = useState<string[]>([]);
  const [exercices, setExercices] = useState<CarnetExercice[]>([
    { nom: "", charge: 0, seriesReps: "", rir: 2, ressenti: 3 },
  ]);
  const [notes, setNotes] = useState("");

  // Load from localStorage
  useEffect(() => {
    setEntries(loadEntries());
  }, []);

  const objectifLabels: Record<string, string> = {
    endurance: t("carnet.objectifEndurance"),
    volume: t("carnet.objectifVolume"),
    puissance: t("carnet.objectifPuissance"),
  };

  /* ── Form handlers ────────────────────────────────────────────────── */

  const toggleMethode = useCallback((slug: string) => {
    setSelectedMethodes((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  }, []);

  const updateExercice = useCallback((index: number, field: keyof CarnetExercice, value: string | number) => {
    setExercices((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }, []);

  const addExercice = useCallback(() => {
    setExercices((prev) => [...prev, { nom: "", charge: 0, seriesReps: "", rir: 2, ressenti: 3 }]);
  }, []);

  const removeExercice = useCallback((index: number) => {
    setExercices((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const resetForm = useCallback(() => {
    setDate(new Date().toISOString().slice(0, 10));
    setObjectif("endurance");
    setSelectedMethodes([]);
    setExercices([{ nom: "", charge: 0, seriesReps: "", rir: 2, ressenti: 3 }]);
    setNotes("");
  }, []);

  const saveEntry = useCallback(() => {
    const entry: CarnetEntry = {
      id: crypto.randomUUID(),
      date,
      objectif,
      methodes: selectedMethodes,
      exercices: exercices.filter((e) => e.nom.trim()),
      notes,
    };
    const next = [entry, ...entries];
    setEntries(next);
    saveEntries(next);
    resetForm();
    setTab("history");
  }, [date, objectif, selectedMethodes, exercices, notes, entries, resetForm]);

  const deleteEntry = useCallback((id: string) => {
    const next = entries.filter((e) => e.id !== id);
    setEntries(next);
    saveEntries(next);
  }, [entries]);

  /* ── Export ────────────────────────────────────────────────────────── */

  const exportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `carnet-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [entries]);

  /* ── Render ───────────────────────────────────────────────────────── */

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          type="button"
          className={`pill ${tab === "form" ? "pill-active" : ""}`}
          onClick={() => setTab("form")}
        >
          {t("carnet.tabForm")}
        </button>
        <button
          type="button"
          className={`pill ${tab === "history" ? "pill-active" : ""}`}
          onClick={() => setTab("history")}
        >
          {t("carnet.tabHistory")} ({entries.length})
        </button>
      </div>

      {/* ── Form tab ──────────────────────────────────────────────────── */}
      {tab === "form" && (
        <div className="stack-md">
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

          {/* Objectif */}
          <fieldset className="carnet-field">
            <legend className="carnet-label">{t("carnet.objectif")}</legend>
            <div className="flex gap-2 flex-wrap">
              {OBJECTIFS.map((o) => {
                const color = OBJECTIF_COLORS[o];
                const isActive = objectif === o;
                return (
                  <button
                    key={o}
                    type="button"
                    className="rounded-full border px-4 py-1.5 text-sm font-bold transition-all"
                    style={{
                      borderColor: isActive ? color : "var(--border)",
                      background: isActive ? `color-mix(in srgb, ${color} 15%, transparent)` : "transparent",
                      color: isActive ? color : "var(--muted)",
                    }}
                    onClick={() => setObjectif(o)}
                  >
                    {objectifLabels[o]}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Méthodes */}
          <fieldset className="carnet-field">
            <legend className="carnet-label">{t("carnet.methodes")}</legend>
            <div className="flex gap-2 flex-wrap">
              {methodeNames.map((m) => (
                <button
                  key={m.slug}
                  type="button"
                  className={`pill text-xs ${selectedMethodes.includes(m.slug) ? "pill-active" : ""}`}
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
            <div className="stack-sm">
              {exercices.map((ex, i) => (
                <div key={i} className="card carnet-exo-row">
                  <div className="carnet-exo-grid">
                    <select
                      className="carnet-input"
                      value={ex.nom}
                      onChange={(e) => updateExercice(i, "nom", e.target.value)}
                    >
                      <option value="">{t("carnet.selectExercice")}</option>
                      {exerciceNames.map((e) => (
                        <option key={e.slug} value={e.title}>{e.title}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      inputMode="decimal"
                      className="carnet-input"
                      placeholder={t("carnet.charge")}
                      value={ex.charge || ""}
                      onChange={(e) => updateExercice(i, "charge", Number(e.target.value))}
                      min={0}
                    />
                    <input
                      type="text"
                      className="carnet-input"
                      placeholder={t("carnet.seriesReps")}
                      value={ex.seriesReps}
                      onChange={(e) => updateExercice(i, "seriesReps", e.target.value)}
                    />
                    <input
                      type="number"
                      inputMode="numeric"
                      className="carnet-input"
                      placeholder={t("carnet.rirPlaceholder")}
                      value={ex.rir}
                      onChange={(e) => updateExercice(i, "rir", Number(e.target.value))}
                      min={0}
                      max={5}
                    />
                    <div className="carnet-ressenti">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          className={`carnet-ressenti-btn ${ex.ressenti >= n ? "active" : ""}`}
                          onClick={() => updateExercice(i, "ressenti", n)}
                          aria-label={`${t("carnet.ressenti")} ${n}/5`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  {exercices.length > 1 && (
                    <button type="button" className="carnet-remove-btn" onClick={() => removeExercice(i)} aria-label={t("carnet.delete")}>
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" className="pill" onClick={addExercice}>
                <Plus size={14} /> {t("carnet.addExercice")}
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

          {/* Save */}
          <button type="button" className="primary-button" onClick={saveEntry}>
            {t("carnet.save")}
          </button>
        </div>
      )}

      {/* ── History tab ───────────────────────────────────────────────── */}
      {tab === "history" && (
        <div className="stack-md">
          {entries.length === 0 && (
            <p className="text-center text-[color:var(--muted)]">{t("carnet.emptyHistory")}</p>
          )}

          {/* Export buttons */}
          {entries.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <button type="button" className="pill" onClick={exportJson}>
                <Download size={14} /> {t("carnet.exportJson")}
              </button>
              <button type="button" className="pill" onClick={() => window.print()}>
                <Printer size={14} /> {t("carnet.print")}
              </button>
            </div>
          )}

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
                        background: `color-mix(in srgb, ${OBJECTIF_COLORS[entry.objectif] || "var(--accent)"} 15%, transparent)`,
                        color: OBJECTIF_COLORS[entry.objectif] || "var(--accent)",
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
                          <th>{t("carnet.seriesReps")}</th>
                          <th>RIR</th>
                          <th>{t("carnet.ressenti")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entry.exercices.map((ex, i) => (
                          <tr key={i}>
                            <td>{ex.nom}</td>
                            <td>{ex.charge ? `${ex.charge} kg` : "–"}</td>
                            <td>{ex.seriesReps || "–"}</td>
                            <td>{ex.rir}</td>
                            <td>{"★".repeat(ex.ressenti)}{"☆".repeat(5 - ex.ressenti)}</td>
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
        </div>
      )}
    </div>
  );
}
