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
          Pour progresser, tu dois conna\u00eetre et contr\u00f4ler ton <strong className="text-zinc-800 dark:text-zinc-200">niveau d&apos;intensit\u00e9</strong> \u00e0 chaque s\u00e9rie. Trois outils compl\u00e9mentaires : le RM, le RIR et le RPE.
        </p>
      </div>

      {/* RM */}
      <LearnAccordion title="RM \u2014 R\u00e9p\u00e9tition Maximale" subtitle="Charge max \u00b7 mesure objective \u00b7 % du 1RM" icon={<IconWeight />} accentColor="#00E5FF">
        <div className="grid grid-cols-2 gap-2">
          <LearnMiniCard label="1RM" accentColor="#00E5FF">Charge max pour 1 seule rep avec technique correcte.</LearnMiniCard>
          <LearnMiniCard label="5RM / 10RM" accentColor="#00E5FF">Charge max pour 5 ou 10 reps.</LearnMiniCard>
        </div>
        <LearnScale accentColor="#00E5FF" levels={[
          { value: "50-70%", label: "Endurance de force \u2014 12-20 reps", color: "#22c55e" },
          { value: "65-80%", label: "Gain de volume \u2014 8-12 reps", color: "#3b82f6" },
          { value: "80-95%", label: "Gain de puissance \u2014 1-6 reps", color: "#f97316" },
        ]} />
        <div className="rounded-[10px] p-[10px_12px]" style={{ background: "rgba(0,229,255,0.04)", border: "1px solid rgba(0,229,255,0.08)" }}>
          <p className="text-[11px] font-medium text-cyan-500">Formule de Brzycki</p>
          <p className="text-[13px] font-mono text-zinc-700 dark:text-zinc-300 mt-1">1RM \u2248 Charge \u00d7 (36 / (37 \u2212 reps))</p>
          <p className="text-[11px] text-zinc-500 mt-1">Ex : 60 kg \u00d7 10 reps \u2192 1RM \u2248 80 kg</p>
        </div>
        <LearnWarning>En Seconde et Premi\u00e8re, pas besoin de tester le 1RM r\u00e9el. L&apos;estimation depuis 10-12 reps est plus s\u00fbre.</LearnWarning>
        <LearnMethodChips accentColor="#00E5FF" methods={[{ label: "Calculer mon 1RM \u2192", href: "/outils/calculateur-rm" }]} />
      </LearnAccordion>

      {/* RIR */}
      <LearnAccordion title="RIR \u2014 Reps In Reserve" subtitle="Reps restantes \u00b7 estimation subjective" icon={<IconGauge />} accentColor="#7B2FFF">
        <LearnScale accentColor="#7B2FFF" levels={[
          { value: "RIR 5+", label: "Trop facile \u2014 charge insuffisante", color: "#22c55e" },
          { value: "RIR 3-4", label: "Effort notable \u2014 zone correcte", color: "#84cc16" },
          { value: "RIR 2-3", label: "Zone de travail optimale", color: "#eab308" },
          { value: "RIR 1", label: "Quasi-maximum \u2014 1 rep en r\u00e9serve", color: "#f97316" },
          { value: "RIR 0", label: "\u00c9chec musculaire \u2014 impossible de continuer", color: "#ef4444" },
        ]} />
        <div className="grid grid-cols-2 gap-2">
          <LearnMiniCard label="RIR > 4" accentColor="#7B2FFF">Augmente la charge</LearnMiniCard>
          <LearnMiniCard label="RIR 0-1" accentColor="#7B2FFF">Limite \u2014 ponctuellement</LearnMiniCard>
        </div>
        <LearnWarning>En Seconde, apprends d&apos;abord \u00e0 reconna\u00eetre la sensation de \u00ab\u00a0br\u00fblure\u00a0\u00bb en fin de s\u00e9rie.</LearnWarning>
      </LearnAccordion>

      {/* RPE */}
      <LearnAccordion title="RPE \u2014 Perception de l\u2019effort" subtitle="\u00c9chelle 1-10 \u00b7 effort global ressenti" icon={<IconHeart />} accentColor="#FF006E">
        <LearnScale accentColor="#FF006E" levels={[
          { value: "1-3", label: "Tr\u00e8s facile, \u00e9chauffement", color: "#22c55e" },
          { value: "4-5", label: "Effort mod\u00e9r\u00e9", color: "#84cc16" },
          { value: "6-7", label: "Effort notable, respiration \u00e9lev\u00e9e", color: "#eab308" },
          { value: "8", label: "Difficile, fin de s\u00e9rie perceptible", color: "#f97316" },
          { value: "9", label: "Tr\u00e8s difficile, quasi-maximum", color: "#ef4444" },
          { value: "10", label: "Effort maximal absolu", color: "#dc2626" },
        ]} />
        <LearnWarning>Le RPE tient compte de la fatigue du jour, du sommeil, du stress. Deux jours identiques peuvent donner des RPE diff\u00e9rents.</LearnWarning>
      </LearnAccordion>

      {/* Comparatif */}
      <div className="rounded-2xl border border-white/[0.06] dark:border-white/[0.06] bg-white/[0.03] dark:bg-white/[0.03] p-4">
        <p className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400 tracking-wide uppercase mb-3">COMPARATIF</p>
        <div className="flex flex-col gap-[6px]">
          <LearnMiniCard label="RM" accentColor="#00E5FF">Objectif \u00b7 charge maximale \u00b7 1\u00e8re / Terminale</LearnMiniCard>
          <LearnMiniCard label="RIR" accentColor="#7B2FFF">Estimation \u00b7 reps restantes \u00b7 d\u00e8s la Seconde</LearnMiniCard>
          <LearnMiniCard label="RPE" accentColor="#FF006E">Subjectif \u00b7 perception globale \u00b7 1\u00e8re / Terminale</LearnMiniCard>
        </div>
      </div>
    </div>
  );
}
