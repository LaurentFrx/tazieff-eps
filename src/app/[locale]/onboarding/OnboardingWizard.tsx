"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Dumbbell, Target, Zap } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { getZone, type Zone } from "@/lib/exercices/zoneMap";

/* ── Types ──────────────────────────────────────────────────────────── */

type Methode = { slug: string; titre: string; categorie: string };
type Exercice = { slug: string; title: string; muscles: string[] };
type Objectif = "endurance" | "volume" | "puissance";
type Step = 1 | 2 | 3 | 4 | 5;

const MAX_EXERCICES = 6;

const OBJECTIF_CATEGORIES: Record<Objectif, string[]> = {
  endurance: ["endurance-de-force"],
  volume: ["gain-de-volume"],
  puissance: ["gain-de-puissance"],
};

const OBJECTIF_ICONS: Record<Objectif, typeof Target> = {
  endurance: Target,
  volume: Dumbbell,
  puissance: Zap,
};

const STORAGE_DONE = "tazieff-onboarding-done";

type Props = {
  methodes: Methode[];
  exercices: Exercice[];
};

export function OnboardingWizard({ methodes, exercices }: Props) {
  const { t } = useI18n();
  const [step, setStep] = useState<Step>(1);
  const [objectif, setObjectif] = useState<Objectif | null>(null);
  const [selectedMethodes, setSelectedMethodes] = useState<string[]>([]);
  const [selectedExercices, setSelectedExercices] = useState<string[]>([]);

  /* ── Derived data ─────────────────────────────────────────────────── */

  const filteredMethodes = objectif
    ? methodes.filter((m) => OBJECTIF_CATEGORIES[objectif].includes(m.categorie))
    : methodes.slice(0, 3);

  // Zone balance feedback
  const selectedExoData = exercices.filter((e) => selectedExercices.includes(e.slug));
  const zoneCounts: Record<Zone, number> = { haut: 0, milieu: 0, bas: 0 };
  for (const exo of selectedExoData) {
    const zones = new Set(exo.muscles.map(getZone));
    for (const z of zones) zoneCounts[z]++;
  }

  const objectifLabels: Record<Objectif, { title: string; desc: string }> = {
    endurance: { title: t("onboarding.objEndurance"), desc: t("onboarding.objEnduranceDesc") },
    volume: { title: t("onboarding.objVolume"), desc: t("onboarding.objVolumeDesc") },
    puissance: { title: t("onboarding.objPuissance"), desc: t("onboarding.objPuissanceDesc") },
  };

  /* ── Handlers ─────────────────────────────────────────────────────── */

  const toggleMethode = useCallback((slug: string) => {
    setSelectedMethodes((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  }, []);

  const toggleExercice = useCallback((slug: string) => {
    setSelectedExercices((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= MAX_EXERCICES) return prev;
      return [...prev, slug];
    });
  }, []);

  const finish = useCallback(() => {
    try { localStorage.setItem(STORAGE_DONE, "true"); } catch { /* ignore */ }
    setStep(5);
  }, []);

  /* ── Step labels ──────────────────────────────────────────────────── */

  const stepLabels = [
    { num: 1 as Step, label: t("onboarding.step1") },
    { num: 2 as Step, label: t("onboarding.step2") },
    { num: 3 as Step, label: t("onboarding.step3") },
    { num: 4 as Step, label: t("onboarding.step4") },
    { num: 5 as Step, label: t("onboarding.step5") },
  ];

  /* ── Render ───────────────────────────────────────────────────────── */

  return (
    <section className="page">
      {/* Progress bar */}
      <div className="flex items-center gap-1 mb-6">
        {stepLabels.map(({ num, label }) => (
          <div key={num} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={`h-1 w-full rounded-full transition-colors ${
                num <= step ? "bg-[color:var(--accent)]" : "bg-[color:var(--border)]"
              }`}
            />
            <span
              className={`text-xs font-semibold ${
                num === step ? "text-[color:var(--accent)]" : "text-[color:var(--muted)]"
              }`}
            >
              {num}. {label}
            </span>
          </div>
        ))}
      </div>

      {/* ── Step 1: Bienvenue ──────────────────────────────────────────── */}
      {step === 1 && (
        <div className="onboarding-step">
          <h1 className="text-2xl font-bold text-[color:var(--ink)]">{t("onboarding.welcomeTitle")}</h1>
          <p className="text-[color:var(--muted)] text-sm mt-2">{t("onboarding.welcomeBody")}</p>
          <button type="button" className="primary-button mt-6" onClick={() => setStep(2)}>
            {t("onboarding.letsGo")} <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* ── Step 2: Objectif ───────────────────────────────────────────── */}
      {step === 2 && (
        <div className="onboarding-step">
          <h2 className="text-xl font-bold text-[color:var(--ink)]">{t("onboarding.chooseObjectif")}</h2>
          <div className="grid gap-3 mt-4 sm:grid-cols-3">
            {(["endurance", "volume", "puissance"] as Objectif[]).map((o) => {
              const Icon = OBJECTIF_ICONS[o];
              const selected = objectif === o;
              return (
                <button
                  key={o}
                  type="button"
                  className={`card flex flex-col items-center gap-2 p-5 text-center transition-colors ${
                    selected ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)]" : ""
                  }`}
                  onClick={() => setObjectif(o)}
                >
                  <Icon size={28} className={selected ? "text-[color:var(--accent)]" : "text-[color:var(--muted)]"} />
                  <span className="font-semibold text-[color:var(--ink)]">{objectifLabels[o].title}</span>
                  <span className="text-xs text-[color:var(--muted)]">{objectifLabels[o].desc}</span>
                </button>
              );
            })}
          </div>
          <div className="flex gap-2 mt-6">
            <button type="button" className="pill" onClick={() => setStep(1)}>
              <ArrowLeft size={14} /> {t("onboarding.back")}
            </button>
            <button
              type="button"
              className="primary-button"
              disabled={!objectif}
              onClick={() => setStep(3)}
            >
              {t("onboarding.next")} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Méthode ────────────────────────────────────────────── */}
      {step === 3 && (
        <div className="onboarding-step">
          <h2 className="text-xl font-bold text-[color:var(--ink)]">{t("onboarding.chooseMethode")}</h2>
          <p className="text-sm text-[color:var(--muted)] mt-1">{t("onboarding.methodeHint")}</p>
          <div className="stack-sm mt-4">
            {filteredMethodes.map((m) => {
              const selected = selectedMethodes.includes(m.slug);
              return (
                <button
                  key={m.slug}
                  type="button"
                  className={`card flex items-center gap-3 p-3 text-left transition-colors ${
                    selected ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)]" : ""
                  }`}
                  onClick={() => toggleMethode(m.slug)}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                      selected
                        ? "border-[color:var(--accent)] bg-[color:var(--accent)] text-white"
                        : "border-[color:var(--border)] text-[color:var(--muted)]"
                    }`}
                  >
                    {selected ? <Check size={12} /> : ""}
                  </span>
                  <span className="font-semibold text-sm text-[color:var(--ink)]">{m.titre}</span>
                </button>
              );
            })}
          </div>
          <div className="flex gap-2 mt-6">
            <button type="button" className="pill" onClick={() => setStep(2)}>
              <ArrowLeft size={14} /> {t("onboarding.back")}
            </button>
            <button
              type="button"
              className="primary-button"
              disabled={selectedMethodes.length === 0}
              onClick={() => setStep(4)}
            >
              {t("onboarding.next")} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Exercices ──────────────────────────────────────────── */}
      {step === 4 && (
        <div className="onboarding-step">
          <h2 className="text-xl font-bold text-[color:var(--ink)]">{t("onboarding.chooseExercices")}</h2>
          <p className="text-sm text-[color:var(--muted)] mt-1">
            {t("onboarding.exerciceHint")} ({selectedExercices.length}/{MAX_EXERCICES})
          </p>

          {/* Zone balance indicator */}
          {selectedExercices.length > 0 && (
            <div className="flex gap-3 mt-3 text-xs">
              {(["haut", "milieu", "bas"] as Zone[]).map((z) => (
                <span
                  key={z}
                  className={`pill text-xs ${zoneCounts[z] > 0 ? "pill-active" : ""}`}
                >
                  {t(`onboarding.zone${z.charAt(0).toUpperCase() + z.slice(1)}` as string)} : {zoneCounts[z]}
                </span>
              ))}
            </div>
          )}

          <div className="grid gap-2 mt-4 sm:grid-cols-2">
            {exercices.map((ex) => {
              const selected = selectedExercices.includes(ex.slug);
              const disabled = !selected && selectedExercices.length >= MAX_EXERCICES;
              return (
                <button
                  key={ex.slug}
                  type="button"
                  disabled={disabled}
                  className={`card flex items-center gap-3 p-3 text-left transition-colors disabled:opacity-40 ${
                    selected ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)]" : ""
                  }`}
                  onClick={() => toggleExercice(ex.slug)}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                      selected
                        ? "border-[color:var(--accent)] bg-[color:var(--accent)] text-white"
                        : "border-[color:var(--border)] text-[color:var(--muted)]"
                    }`}
                  >
                    {selected ? <Check size={12} /> : ""}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[color:var(--ink)]">{ex.title}</p>
                    <p className="mt-0.5 truncate text-xs text-[color:var(--muted)]">
                      {ex.muscles.join(", ")}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="flex gap-2 mt-6">
            <button type="button" className="pill" onClick={() => setStep(3)}>
              <ArrowLeft size={14} /> {t("onboarding.back")}
            </button>
            <button
              type="button"
              className="primary-button"
              disabled={selectedExercices.length < 4}
              onClick={finish}
            >
              {t("onboarding.finish")} <Check size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 5: Récap ──────────────────────────────────────────────── */}
      {step === 5 && (
        <div className="onboarding-step">
          <h2 className="text-xl font-bold text-[color:var(--ink)]">{t("onboarding.recapTitle")}</h2>
          <div className="card mt-4">
            <p className="text-sm font-semibold text-[color:var(--muted)]">{t("onboarding.recapObjectif")}</p>
            <p className="text-[color:var(--ink)] font-semibold">
              {objectif ? objectifLabels[objectif].title : ""}
            </p>
          </div>
          <div className="card mt-3">
            <p className="text-sm font-semibold text-[color:var(--muted)]">{t("onboarding.recapMethodes")}</p>
            <div className="flex gap-2 flex-wrap mt-1">
              {selectedMethodes.map((slug) => {
                const m = methodes.find((me) => me.slug === slug);
                return <span key={slug} className="pill pill-active text-xs">{m?.titre ?? slug}</span>;
              })}
            </div>
          </div>
          <div className="card mt-3">
            <p className="text-sm font-semibold text-[color:var(--muted)]">{t("onboarding.recapExercices")}</p>
            <ul className="mt-1 space-y-1">
              {selectedExoData.map((ex) => (
                <li key={ex.slug} className="text-sm text-[color:var(--ink)]">
                  {ex.title} <span className="text-[color:var(--muted)]">— {ex.muscles.join(", ")}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex gap-3 mt-6 flex-wrap">
            <Link href="/outils/timer" className="primary-button">
              {t("onboarding.goTimer")}
            </Link>
            <Link href="/outils/carnet" className="pill">
              {t("onboarding.goCarnet")}
            </Link>
            <Link href="/exercices" className="pill">
              {t("onboarding.goExercices")}
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
