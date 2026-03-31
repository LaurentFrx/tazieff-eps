"use client";

import { LearnAccordion, LearnScale, LearnMiniCard, LearnWarning, LearnMethodChips } from "@/components/learn";

/* ── Icons ── */

function IconWeight() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 6.5L17.5 17.5" /><path d="M3.5 10L10 3.5" /><path d="M14 20.5L20.5 14" /><path d="M2 11.5l1.5-1.5" /><path d="M20.5 13L22 11.5" />
    </svg>
  );
}

function IconGauge() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 100 20 10 10 0 000-20z" /><path d="M12 6v6l4 2" />
    </svg>
  );
}

function IconHeart() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

/* ── Main ── */

export function RmRirRpeContent() {
  return (
    <div className="flex flex-col gap-3">
      {/* Intro */}
      <div className="rounded-2xl border border-white/[0.06] dark:border-white/[0.06] bg-white/[0.03] dark:bg-white/[0.03] p-4">
        <p className="text-[13px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Pour progresser, tu dois connaître et contrôler ton <strong className="text-zinc-800 dark:text-zinc-200">niveau d&apos;intensité</strong> à chaque série. Trois outils complémentaires : le RM, le RIR et le RPE.
        </p>
      </div>

      {/* RM */}
      <LearnAccordion title="RM — Répétition Maximale" subtitle="Charge max · mesure objective · % du 1RM" icon={<IconWeight />} accentColor="#00E5FF">
        <div className="grid grid-cols-2 gap-2">
          <LearnMiniCard label="1RM" accentColor="#00E5FF">Charge max pour 1 seule rep avec technique correcte.</LearnMiniCard>
          <LearnMiniCard label="5RM / 10RM" accentColor="#00E5FF">Charge max pour 5 ou 10 reps.</LearnMiniCard>
        </div>
        <LearnScale accentColor="#00E5FF" levels={[
          { value: "50-70%", label: "Endurance de force — 12-20 reps", color: "#22c55e" },
          { value: "65-80%", label: "Gain de volume — 8-12 reps", color: "#3b82f6" },
          { value: "80-95%", label: "Gain de puissance — 1-6 reps", color: "#f97316" },
        ]} />
        <div className="rounded-[10px] p-[10px_12px]" style={{ background: "rgba(0,229,255,0.04)", border: "1px solid rgba(0,229,255,0.08)" }}>
          <p className="text-[11px] font-medium text-cyan-500">Formule de Brzycki</p>
          <p className="text-[13px] font-mono text-zinc-700 dark:text-zinc-300 mt-1">1RM ≈ Charge × (36 / (37 − reps))</p>
          <p className="text-[11px] text-zinc-500 mt-1">Ex : 60 kg × 10 reps → 1RM ≈ 80 kg</p>
        </div>
        <LearnWarning>En Seconde et Première, pas besoin de tester le 1RM réel. L&apos;estimation depuis 10-12 reps est plus sûre.</LearnWarning>
        <LearnMethodChips accentColor="#00E5FF" methods={[{ label: "Calculer mon 1RM →", href: "/outils/calculateur-rm" }]} />
      </LearnAccordion>

      {/* RIR */}
      <LearnAccordion title="RIR — Reps In Reserve" subtitle="Reps restantes · estimation subjective" icon={<IconGauge />} accentColor="#7B2FFF">
        <LearnScale accentColor="#7B2FFF" levels={[
          { value: "RIR 5+", label: "Trop facile — charge insuffisante", color: "#22c55e" },
          { value: "RIR 3-4", label: "Effort notable — zone correcte", color: "#84cc16" },
          { value: "RIR 2-3", label: "Zone de travail optimale", color: "#eab308" },
          { value: "RIR 1", label: "Quasi-maximum — 1 rep en réserve", color: "#f97316" },
          { value: "RIR 0", label: "Échec musculaire — impossible de continuer", color: "#ef4444" },
        ]} />
        <div className="grid grid-cols-2 gap-2">
          <LearnMiniCard label="RIR > 4" accentColor="#7B2FFF">Augmente la charge</LearnMiniCard>
          <LearnMiniCard label="RIR 0-1" accentColor="#7B2FFF">Limite — ponctuellement</LearnMiniCard>
        </div>
        <LearnWarning>En Seconde, apprends d&apos;abord à reconnaître la sensation de « brûlure » en fin de série.</LearnWarning>
      </LearnAccordion>

      {/* RPE */}
      <LearnAccordion title="RPE — Perception de l’effort" subtitle="Échelle 1-10 · effort global ressenti" icon={<IconHeart />} accentColor="#FF006E">
        <LearnScale accentColor="#FF006E" levels={[
          { value: "1-3", label: "Très facile, échauffement", color: "#22c55e" },
          { value: "4-5", label: "Effort modéré", color: "#84cc16" },
          { value: "6-7", label: "Effort notable, respiration élevée", color: "#eab308" },
          { value: "8", label: "Difficile, fin de série perceptible", color: "#f97316" },
          { value: "9", label: "Très difficile, quasi-maximum", color: "#ef4444" },
          { value: "10", label: "Effort maximal absolu", color: "#dc2626" },
        ]} />
        <LearnWarning>Le RPE tient compte de la fatigue du jour, du sommeil, du stress. Deux jours identiques peuvent donner des RPE différents.</LearnWarning>
      </LearnAccordion>

      {/* Comparatif */}
      <div className="rounded-2xl border border-white/[0.06] dark:border-white/[0.06] bg-white/[0.03] dark:bg-white/[0.03] p-4">
        <p className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400 tracking-wide uppercase mb-3">COMPARATIF</p>
        <div className="flex flex-col gap-[6px]">
          <LearnMiniCard label="RM" accentColor="#00E5FF">Objectif · charge maximale · 1ère / Terminale</LearnMiniCard>
          <LearnMiniCard label="RIR" accentColor="#7B2FFF">Estimation · reps restantes · dès la Seconde</LearnMiniCard>
          <LearnMiniCard label="RPE" accentColor="#FF006E">Subjectif · perception globale · 1ère / Terminale</LearnMiniCard>
        </div>
      </div>
    </div>
  );
}
