"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, Edit2, Link2, Plus, Share2, Trash2, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useTeacherMode } from "@/hooks/useTeacherMode";
import { getEnseignantLabels } from "./labels";

/* ── Types ──────────────────────────────────────────────────────────── */

type TeacherSession = {
  id: string;
  titre: string;
  niveau: "seconde" | "premiere" | "terminale";
  objectif: "endurance" | "volume" | "puissance";
  consignes: string;
  methodes: string[];
  exercices: string[];
  createdAt: string;
};

type Props = {
  methodeNames: { slug: string; titre: string }[];
  exerciceNames: { slug: string; title: string }[];
};

const STORAGE_KEY = "tazieff-teacher-sessions";
const NIVEAUX = ["seconde", "premiere", "terminale"] as const;
const OBJECTIFS = ["endurance", "volume", "puissance"] as const;

function loadSessions(): TeacherSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TeacherSession[]) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: TeacherSession[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions)); } catch { /* ignore */ }
}

function encodeSession(session: TeacherSession): string {
  const short = {
    t: session.titre,
    n: session.niveau,
    o: session.objectif,
    c: session.consignes,
    m: session.methodes,
    e: session.exercices,
  };
  return btoa(encodeURIComponent(JSON.stringify(short)));
}

/* ── Component ──────────────────────────────────────────────────────── */

export function EnseignantDashboard({ methodeNames, exerciceNames }: Props) {
  const { t } = useI18n();
  const { unlocked, pin, unlock } = useTeacherMode();
  const [sessions, setSessions] = useState<TeacherSession[]>([]);
  const [editing, setEditing] = useState<TeacherSession | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState("");

  // Form state
  const [titre, setTitre] = useState("");
  const [niveau, setNiveau] = useState<TeacherSession["niveau"]>("seconde");
  const [objectif, setObjectif] = useState<TeacherSession["objectif"]>("endurance");
  const [consignes, setConsignes] = useState("");
  const [selectedMethodes, setSelectedMethodes] = useState<string[]>([]);
  const [selectedExercices, setSelectedExercices] = useState<string[]>([]);

  useEffect(() => {
    if (unlocked) setSessions(loadSessions());
  }, [unlocked]);

  const { niveauLabels, objectifLabels } = getEnseignantLabels(t);

  /* ── Form helpers ─────────────────────────────────────────────────── */

  const resetForm = useCallback(() => {
    setTitre("");
    setNiveau("seconde");
    setObjectif("endurance");
    setConsignes("");
    setSelectedMethodes([]);
    setSelectedExercices([]);
    setEditing(null);
    setShowForm(false);
  }, []);

  const openEdit = useCallback((session: TeacherSession) => {
    setTitre(session.titre);
    setNiveau(session.niveau);
    setObjectif(session.objectif);
    setConsignes(session.consignes);
    setSelectedMethodes(session.methodes);
    setSelectedExercices(session.exercices);
    setEditing(session);
    setShowForm(true);
  }, []);

  const saveSession = useCallback(() => {
    if (!titre.trim()) return;
    const session: TeacherSession = {
      id: editing?.id ?? crypto.randomUUID(),
      titre,
      niveau,
      objectif,
      consignes,
      methodes: selectedMethodes,
      exercices: selectedExercices,
      createdAt: editing?.createdAt ?? new Date().toISOString(),
    };
    const next = editing
      ? sessions.map((s) => (s.id === editing.id ? session : s))
      : [session, ...sessions];
    setSessions(next);
    saveSessions(next);
    resetForm();
  }, [titre, niveau, objectif, consignes, selectedMethodes, selectedExercices, editing, sessions, resetForm]);

  const deleteSession = useCallback((id: string) => {
    const next = sessions.filter((s) => s.id !== id);
    setSessions(next);
    saveSessions(next);
  }, [sessions]);

  const share = useCallback((session: TeacherSession) => {
    const encoded = encodeSession(session);
    const url = `${window.location.origin}/enseignant/partage?seance=${encoded}`;
    setShareUrl(url);
    try { navigator.clipboard.writeText(url); } catch { /* ignore */ }
  }, []);

  const toggleMethode = useCallback((slug: string) => {
    setSelectedMethodes((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  }, []);

  const toggleExercice = useCallback((slug: string) => {
    setSelectedExercices((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= 8) return prev;
      return [...prev, slug];
    });
  }, []);

  /* ── PIN gate ─────────────────────────────────────────────────────── */

  if (!unlocked) {
    return (
      <section className="page">
        <header className="page-header">
          <h1>{t("enseignant.title")}</h1>
          <p className="lede">{t("enseignant.locked")}</p>
        </header>
        <div className="card" style={{ maxWidth: 360, margin: "0 auto" }}>
          <label className="carnet-field">
            <span className="carnet-label">PIN</span>
            <input
              type="password"
              className="carnet-input"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && pinInput) unlock(pinInput); }}
              placeholder="••••"
            />
          </label>
          <button
            type="button"
            className="primary-button mt-4"
            onClick={() => { if (pinInput) unlock(pinInput); }}
          >
            {t("enseignant.unlock")}
          </button>
        </div>
      </section>
    );
  }

  /* ── Dashboard ────────────────────────────────────────────────────── */

  return (
    <section className="page">
      <header className="page-header">
        <h1>{t("enseignant.title")}</h1>
        <p className="lede">{t("enseignant.lede")}</p>
      </header>

      {/* Share URL banner */}
      {shareUrl && (
        <div className="share-url-box">
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-semibold text-[color:var(--ink)]">{t("enseignant.shareReady")}</p>
            <p className="text-xs text-[color:var(--muted)] truncate mt-1">{shareUrl}</p>
          </div>
          <button type="button" className="pill text-xs" onClick={() => { try { navigator.clipboard.writeText(shareUrl); } catch {/* */} }}>
            <Copy size={12} /> {t("enseignant.copy")}
          </button>
          <button type="button" onClick={() => setShareUrl(null)} className="enseignant-close-btn" aria-label={t("enseignant.close")}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Actions */}
      {!showForm && (
        <button type="button" className="primary-button" onClick={() => setShowForm(true)}>
          <Plus size={16} /> {t("enseignant.newSession")}
        </button>
      )}

      {/* ── Form ──────────────────────────────────────────────────────── */}
      {showForm && (
        <div className="card stack-md">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[color:var(--ink)]">
              {editing ? t("enseignant.editSession") : t("enseignant.newSession")}
            </h2>
            <button type="button" onClick={resetForm} className="enseignant-close-btn" aria-label={t("enseignant.close")}>
              <X size={16} />
            </button>
          </div>

          <label className="carnet-field">
            <span className="carnet-label">{t("enseignant.sessionTitle")}</span>
            <input
              type="text"
              className="carnet-input"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder={t("enseignant.sessionTitlePlaceholder")}
            />
          </label>

          <fieldset className="carnet-field">
            <legend className="carnet-label">{t("enseignant.niveau")}</legend>
            <div className="flex gap-2 flex-wrap">
              {NIVEAUX.map((n) => (
                <button key={n} type="button" className={`pill ${niveau === n ? "pill-active" : ""}`} onClick={() => setNiveau(n)}>
                  {niveauLabels[n]}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="carnet-field">
            <legend className="carnet-label">{t("enseignant.objectif")}</legend>
            <div className="flex gap-2 flex-wrap">
              {OBJECTIFS.map((o) => (
                <button key={o} type="button" className={`pill ${objectif === o ? "pill-active" : ""}`} onClick={() => setObjectif(o)}>
                  {objectifLabels[o]}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="carnet-field">
            <span className="carnet-label">{t("enseignant.consignes")}</span>
            <textarea
              className="carnet-input"
              rows={3}
              value={consignes}
              onChange={(e) => setConsignes(e.target.value)}
              placeholder={t("enseignant.consignesPlaceholder")}
            />
          </label>

          <fieldset className="carnet-field">
            <legend className="carnet-label">{t("enseignant.methodes")}</legend>
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

          <fieldset className="carnet-field">
            <legend className="carnet-label">
              {t("enseignant.exercices")} ({selectedExercices.length}/8)
            </legend>
            <div className="flex gap-2 flex-wrap" style={{ maxHeight: 200, overflowY: "auto" }}>
              {exerciceNames.map((e) => {
                const sel = selectedExercices.includes(e.slug);
                return (
                  <button
                    key={e.slug}
                    type="button"
                    disabled={!sel && selectedExercices.length >= 8}
                    className={`pill text-xs ${sel ? "pill-active" : ""} disabled:opacity-40`}
                    onClick={() => toggleExercice(e.slug)}
                  >
                    {e.title}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <button
            type="button"
            className="primary-button"
            disabled={!titre.trim()}
            onClick={saveSession}
          >
            {editing ? t("enseignant.saveChanges") : t("enseignant.create")}
          </button>
        </div>
      )}

      {/* ── Session list ──────────────────────────────────────────────── */}
      {!showForm && sessions.length === 0 && (
        <p className="text-center text-[color:var(--muted)] mt-6">{t("enseignant.empty")}</p>
      )}

      {!showForm && sessions.length > 0 && (
        <div className="stack-sm mt-4">
          {sessions.map((session) => (
            <div key={session.id} className="card">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-[color:var(--ink)]">{session.titre}</h3>
                  <p className="text-xs text-[color:var(--muted)] mt-1">
                    {niveauLabels[session.niveau]} · {objectifLabels[session.objectif]} · {session.exercices.length} exos
                  </p>
                  {session.consignes && (
                    <p className="text-sm text-[color:var(--muted)] mt-2">{session.consignes}</p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button type="button" className="enseignant-icon-btn" onClick={() => openEdit(session)} aria-label={t("enseignant.edit")}>
                    <Edit2 size={14} />
                  </button>
                  <button type="button" className="enseignant-icon-btn" onClick={() => share(session)} aria-label={t("enseignant.share")}>
                    <Share2 size={14} />
                  </button>
                  <button type="button" className="enseignant-icon-btn enseignant-icon-btn-danger" onClick={() => deleteSession(session.id)} aria-label={t("enseignant.delete")}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {session.methodes.length > 0 && (
                <div className="flex gap-1 flex-wrap mt-2">
                  {session.methodes.map((slug) => {
                    const m = methodeNames.find((me) => me.slug === slug);
                    return <span key={slug} className="pill text-xs pill-active">{m?.titre ?? slug}</span>;
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
