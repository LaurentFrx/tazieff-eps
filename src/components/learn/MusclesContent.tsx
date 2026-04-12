"use client";

import { LearnAccordion, LearnMuscleRow, LearnMiniCard, LearnWarning, LearnMethodChips } from "@/components/learn";

/* ── Icons ── */

function IconUpperBody() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 012 2v2" /><path d="M20 14v2a2 2 0 01-2 2h-2" /><path d="M8 20H6a2 2 0 01-2-2v-2" /><path d="M4 10V8a2 2 0 012-2h2" /><path d="M12 8v8" /><path d="M8 12h8" />
    </svg>
  );
}

function IconLowerBody() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v8" /><path d="M8 14l-3 8" /><path d="M16 14l3 8" /><path d="M7 10h10" />
    </svg>
  );
}

function IconCore() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" />
    </svg>
  );
}

function IconBalance() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v18" /><path d="M3 7l9-4 9 4" /><path d="M3 7v2a9 9 0 009 9 9 9 0 009-9V7" />
    </svg>
  );
}

function IconIsoVsPoly() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="4" /><circle cx="16" cy="16" r="4" /><path d="M11 5l6 6" />
    </svg>
  );
}

/* ── Main ── */

export function MusclesContent() {
  return (
    <div className="flex flex-col gap-3">
      {/* Pourquoi */}
      <div className="rounded-2xl border border-white/[0.06] dark:border-white/[0.06] bg-white/[0.03] dark:bg-white/[0.03] p-4">
        <p className="text-[13px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
          S&apos;entraîner sans connaître ses muscles, c&apos;est conduire sans carte. Savoir <strong className="text-zinc-800 dark:text-zinc-200">quel muscle tu travailles</strong>, <strong className="text-zinc-800 dark:text-zinc-200">où il se situe</strong> et <strong className="text-zinc-800 dark:text-zinc-200">quel est son opposé</strong> te permet de construire des séances équilibrées.
        </p>
      </div>

      {/* Face antérieure */}
      <LearnAccordion title="Face antérieure" subtitle="Poitrine · bras · abdos · cuisses avant" icon={<IconUpperBody />} accentColor="#FF006E">
        <div className="flex flex-col gap-[6px]">
          <LearnMuscleRow name="Pectoraux" role="Poussée horizontale (développé couché)" antagonist="Grand Dorsal" href="/exercices?muscle=pectoraux" />
          <LearnMuscleRow name="Biceps" role="Flexion du coude (curl)" antagonist="Triceps" href="/exercices?muscle=bras" />
          <LearnMuscleRow name="Abdominaux" role="Flexion du tronc, gainage" href="/exercices?muscle=abdominaux" />
          <LearnMuscleRow name="Obliques" role="Rotation et flexion latérale" href="/exercices?muscle=abdominaux" />
          <LearnMuscleRow name="Quadriceps" role="Extension du genou (squat, presse)" antagonist="Ischios" href="/exercices?muscle=cuisses" />
          <LearnMuscleRow name="Adducteurs" role="Rapprochement des jambes" href="/exercices?muscle=cuisses" />
        </div>
      </LearnAccordion>

      {/* Face postérieure */}
      <LearnAccordion title="Face postérieure" subtitle="Dos · épaules · fessiers · mollets" icon={<IconLowerBody />} accentColor="#00E5FF">
        <div className="flex flex-col gap-[6px]">
          <LearnMuscleRow name="Trapèzes" role="Élévation et rétraction des épaules" href="/exercices?muscle=dorsaux" />
          <LearnMuscleRow name="Grand Dorsal" role="Tirage vertical et horizontal" antagonist="Pectoraux" href="/exercices?muscle=dorsaux" />
          <LearnMuscleRow name="Triceps" role="Extension du coude" antagonist="Biceps" href="/exercices?muscle=bras" />
          <LearnMuscleRow name="Lombaires" role="Stabilisation du rachis" href="/exercices?muscle=dorsaux" />
          <LearnMuscleRow name="Grand fessier" role="Extension de hanche (hip thrust)" href="/exercices?muscle=fessiers" />
          <LearnMuscleRow name="Ischios-jambiers" role="Flexion du genou" antagonist="Quadriceps" href="/exercices?muscle=cuisses" />
          <LearnMuscleRow name="Mollets" role="Extension plantaire (montée sur pointes)" href="/exercices?muscle=mollets" />
        </div>
      </LearnAccordion>

      {/* Agoniste / Antagoniste */}
      <LearnAccordion title="Agoniste et antagoniste" subtitle="Muscles opposés · équilibre" icon={<IconBalance />} accentColor="#7B2FFF">
        <div className="grid grid-cols-2 gap-2">
          <LearnMiniCard label="Agoniste" accentColor="#7B2FFF">Produit le mouvement — il se contracte.</LearnMiniCard>
          <LearnMiniCard label="Antagoniste" accentColor="#7B2FFF">S&apos;oppose et freine — il se relâche.</LearnMiniCard>
        </div>
        <LearnWarning>Toujours travailler les deux faces d&apos;une articulation. Biceps sans triceps = déséquilibre et blessure.</LearnWarning>
      </LearnAccordion>

      {/* Isolation vs Polyarticulaire */}
      <LearnAccordion title="Isolation vs polyarticulaire" subtitle="1 muscle vs plusieurs · stratégie de séance" icon={<IconIsoVsPoly />} accentColor="#FF006E">
        <div className="grid grid-cols-2 gap-2">
          <LearnMiniCard label="Isolation" accentColor="#FF006E">1 muscle, 1 articulation. Curl, leg extension, écarté.</LearnMiniCard>
          <LearnMiniCard label="Polyarticulaire" accentColor="#FF006E">Plusieurs muscles et articulations. Squat, tractions, rowing.</LearnMiniCard>
        </div>
        <LearnWarning>Stratégie : commencer par les polyarticulaires (frais), finir par les isolations.</LearnWarning>
      </LearnAccordion>

      {/* Équilibre musculaire */}
      <LearnAccordion title="Équilibre musculaire" subtitle="3 équilibres fondamentaux" icon={<IconCore />} accentColor="#00E5FF">
        <div className="flex flex-col gap-[6px]">
          <LearnMiniCard label="1. Agonistes / Antagonistes" accentColor="#00E5FF">Biceps ↔ Triceps · Quadriceps ↔ Ischios · Pectoraux ↔ Grand Dorsal</LearnMiniCard>
          <LearnMiniCard label="2. Stabilisateurs du tronc" accentColor="#00E5FF">Abdominaux (avant) ET lombaires (arrière) pour protéger la colonne.</LearnMiniCard>
          <LearnMiniCard label="3. Haut / Bas du corps" accentColor="#00E5FF">Ne pas négliger les jambes — plus grande masse musculaire du corps.</LearnMiniCard>
        </div>
        <LearnMethodChips accentColor="#00E5FF" methods={[
          { label: "Carte anatomique 3D →", href: "/apprendre/anatomie" },
          { label: "Contractions →", href: "/apprendre/contractions" },
          { label: "Sécurité →", href: "/apprendre/securite" },
        ]} />
      </LearnAccordion>
    </div>
  );
}
