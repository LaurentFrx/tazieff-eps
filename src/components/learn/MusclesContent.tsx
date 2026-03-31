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
          S&apos;entra\u00eener sans conna\u00eetre ses muscles, c&apos;est conduire sans carte. Savoir <strong className="text-zinc-800 dark:text-zinc-200">quel muscle tu travailles</strong>, <strong className="text-zinc-800 dark:text-zinc-200">o\u00f9 il se situe</strong> et <strong className="text-zinc-800 dark:text-zinc-200">quel est son oppos\u00e9</strong> te permet de construire des s\u00e9ances \u00e9quilibr\u00e9es.
        </p>
      </div>

      {/* Face antérieure */}
      <LearnAccordion title="Face ant\u00e9rieure" subtitle="Poitrine \u00b7 bras \u00b7 abdos \u00b7 cuisses avant" icon={<IconUpperBody />} accentColor="#FF006E">
        <div className="flex flex-col gap-[6px]">
          <LearnMuscleRow name="Pectoraux" role="Pouss\u00e9e horizontale (d\u00e9velopp\u00e9 couch\u00e9)" antagonist="Grand Dorsal" />
          <LearnMuscleRow name="Biceps" role="Flexion du coude (curl)" antagonist="Triceps" />
          <LearnMuscleRow name="Abdominaux" role="Flexion du tronc, gainage" />
          <LearnMuscleRow name="Obliques" role="Rotation et flexion lat\u00e9rale" />
          <LearnMuscleRow name="Quadriceps" role="Extension du genou (squat, presse)" antagonist="Ischios" />
          <LearnMuscleRow name="Adducteurs" role="Rapprochement des jambes" />
        </div>
      </LearnAccordion>

      {/* Face postérieure */}
      <LearnAccordion title="Face post\u00e9rieure" subtitle="Dos \u00b7 \u00e9paules \u00b7 fessiers \u00b7 mollets" icon={<IconLowerBody />} accentColor="#00E5FF">
        <div className="flex flex-col gap-[6px]">
          <LearnMuscleRow name="Trap\u00e8zes" role="\u00c9l\u00e9vation et r\u00e9traction des \u00e9paules" />
          <LearnMuscleRow name="Grand Dorsal" role="Tirage vertical et horizontal" antagonist="Pectoraux" />
          <LearnMuscleRow name="Triceps" role="Extension du coude" antagonist="Biceps" />
          <LearnMuscleRow name="Lombaires" role="Stabilisation du rachis" />
          <LearnMuscleRow name="Grand fessier" role="Extension de hanche (hip thrust)" />
          <LearnMuscleRow name="Ischios-jambiers" role="Flexion du genou" antagonist="Quadriceps" />
          <LearnMuscleRow name="Mollets" role="Extension plantaire (mont\u00e9e sur pointes)" />
        </div>
      </LearnAccordion>

      {/* Agoniste / Antagoniste */}
      <LearnAccordion title="Agoniste et antagoniste" subtitle="Muscles oppos\u00e9s \u00b7 \u00e9quilibre" icon={<IconBalance />} accentColor="#7B2FFF">
        <div className="grid grid-cols-2 gap-2">
          <LearnMiniCard label="Agoniste" accentColor="#7B2FFF">Produit le mouvement \u2014 il se contracte.</LearnMiniCard>
          <LearnMiniCard label="Antagoniste" accentColor="#7B2FFF">S&apos;oppose et freine \u2014 il se rel\u00e2che.</LearnMiniCard>
        </div>
        <LearnWarning>Toujours travailler les deux faces d&apos;une articulation. Biceps sans triceps = d\u00e9s\u00e9quilibre et blessure.</LearnWarning>
      </LearnAccordion>

      {/* Isolation vs Polyarticulaire */}
      <LearnAccordion title="Isolation vs polyarticulaire" subtitle="1 muscle vs plusieurs \u00b7 strat\u00e9gie de s\u00e9ance" icon={<IconIsoVsPoly />} accentColor="#FF006E">
        <div className="grid grid-cols-2 gap-2">
          <LearnMiniCard label="Isolation" accentColor="#FF006E">1 muscle, 1 articulation. Curl, leg extension, \u00e9cart\u00e9.</LearnMiniCard>
          <LearnMiniCard label="Polyarticulaire" accentColor="#FF006E">Plusieurs muscles et articulations. Squat, tractions, rowing.</LearnMiniCard>
        </div>
        <LearnWarning>Strat\u00e9gie : commencer par les polyarticulaires (frais), finir par les isolations.</LearnWarning>
      </LearnAccordion>

      {/* Équilibre musculaire */}
      <LearnAccordion title="\u00c9quilibre musculaire" subtitle="3 \u00e9quilibres fondamentaux" icon={<IconCore />} accentColor="#00E5FF">
        <div className="flex flex-col gap-[6px]">
          <LearnMiniCard label="1. Agonistes / Antagonistes" accentColor="#00E5FF">Biceps \u2194 Triceps \u00b7 Quadriceps \u2194 Ischios \u00b7 Pectoraux \u2194 Grand Dorsal</LearnMiniCard>
          <LearnMiniCard label="2. Stabilisateurs du tronc" accentColor="#00E5FF">Abdominaux (avant) ET lombaires (arri\u00e8re) pour prot\u00e9ger la colonne.</LearnMiniCard>
          <LearnMiniCard label="3. Haut / Bas du corps" accentColor="#00E5FF">Ne pas n\u00e9gliger les jambes \u2014 plus grande masse musculaire du corps.</LearnMiniCard>
        </div>
        <LearnMethodChips accentColor="#00E5FF" methods={[
          { label: "Carte anatomique 3D \u2192", href: "/apprendre/anatomie" },
          { label: "Contractions \u2192", href: "/apprendre/contractions" },
          { label: "S\u00e9curit\u00e9 \u2192", href: "/apprendre/securite" },
        ]} />
      </LearnAccordion>
    </div>
  );
}
