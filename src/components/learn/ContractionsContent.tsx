"use client";

import { LearnAccordion, LearnMiniCard, LearnWarning, LearnMethodChips } from "@/components/learn";

/* ── Icons ── */
function IconUp() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5" /><path d="M5 12l7-7 7 7" />
    </svg>
  );
}
function IconDown() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14" /><path d="M5 12l7 7 7-7" />
    </svg>
  );
}
function IconPause() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="6" width="8" height="12" rx="1" />
    </svg>
  );
}
function IconBolt() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

/* ── Comparison row ── */
function ComparisonRow({ type, movement, example, usage, color }: { type: string; movement: string; example: string; usage: string; color: string }) {
  return (
    <div className="flex items-start gap-3 p-[10px_14px] rounded-[10px] bg-white/[0.02] dark:bg-white/[0.02] border border-white/[0.04] dark:border-white/[0.04]">
      <span className="w-[6px] h-[6px] rounded-full shrink-0 mt-1.5" style={{ background: color }} />
      <span className="flex-1 min-w-0">
        <span className="block text-[13px] font-medium text-zinc-700 dark:text-zinc-200">{type}</span>
        <span className="block text-[11px] text-zinc-500">{movement} · {example} · {usage}</span>
      </span>
    </div>
  );
}

/* ── Main ── */
export function ContractionsContent() {
  return (
    <div className="flex flex-col gap-3">
      {/* Intro */}
      <div className="rounded-2xl border border-white/[0.06] dark:border-white/[0.06] bg-white/[0.03] dark:bg-white/[0.03] p-4">
        <p className="text-[13px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Varier les types de contraction permet d&apos;<strong className="text-zinc-800 dark:text-zinc-200">augmenter les bénéfices</strong> et de maintenir la motivation. Chaque type sollicite le muscle différemment.
        </p>
      </div>

      {/* 1 — Concentrique */}
      <LearnAccordion title="Concentrique" subtitle="Le muscle se raccourcit" icon={<IconUp />} accentColor="#00E5FF">
        <p className="text-[12px] text-zinc-500 dark:text-zinc-400 leading-snug">
          Contraction la plus courante. Phase de poussée ou de traction — le muscle se raccourcit pour produire le mouvement.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <LearnMiniCard label="Exemple" accentColor="#00E5FF">Montée du curl biceps, remontée du squat.</LearnMiniCard>
          <LearnMiniCard label="Effort" accentColor="#00E5FF">Phase active — zone de brûlure musculaire.</LearnMiniCard>
        </div>
      </LearnAccordion>

      {/* 2 — Excentrique */}
      <LearnAccordion title="Excentrique" subtitle="Le muscle s’allonge sous tension" icon={<IconDown />} accentColor="#FF006E">
        <p className="text-[12px] text-zinc-500 dark:text-zinc-400 leading-snug">
          Phase de descente contrôlée. Souvent négligée, c&apos;est pourtant la <strong className="text-zinc-800 dark:text-zinc-200">phase la plus efficace</strong> pour le développement musculaire.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <LearnMiniCard label="Exemple" accentColor="#FF006E">Descente contrôlée du squat.</LearnMiniCard>
          <LearnMiniCard label="Conseil" accentColor="#FF006E">Ralentir 2-4 sec pour maximiser les gains.</LearnMiniCard>
        </div>
        <LearnWarning>Toujours contrôler la descente — jamais de chute libre.</LearnWarning>
      </LearnAccordion>

      {/* 3 — Isométrique */}
      <LearnAccordion title="Isométrique" subtitle="Le muscle travaille sans bouger" icon={<IconPause />} accentColor="#7B2FFF">
        <p className="text-[12px] text-zinc-500 dark:text-zinc-400 leading-snug">
          Tension maximale sans changement de longueur. Utile pour renforcer un angle articulaire spécifique ou pour le gainage.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <LearnMiniCard label="Exemple" accentColor="#7B2FFF">Planche, chaise au mur, pause en bas du squat.</LearnMiniCard>
          <LearnMiniCard label="Usage" accentColor="#7B2FFF">Gainage, rééducation, force statique.</LearnMiniCard>
        </div>
        <LearnMethodChips accentColor="#7B2FFF" methods={[{ label: "Stato-dynamique →", href: "/methodes/stato-dynamique" }]} />
      </LearnAccordion>

      {/* 4 — Pliométrique */}
      <LearnAccordion title="Pliométrique" subtitle="Excentrique → concentrique explosif" icon={<IconBolt />} accentColor="#f97316">
        <p className="text-[12px] text-zinc-500 dark:text-zinc-400 leading-snug">
          Le muscle stocke de l&apos;énergie élastique pendant l&apos;étirement rapide et la restitue en contraction explosive. Principe du ressort.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <LearnMiniCard label="Exemple" accentColor="#f97316">Squat jump, pompes pliométriques.</LearnMiniCard>
          <LearnMiniCard label="Usage" accentColor="#f97316">Puissance explosive, sport.</LearnMiniCard>
        </div>
        <LearnWarning>Réservée aux pratiquants avec bonne technique de base.</LearnWarning>
        <LearnMethodChips accentColor="#f97316" methods={[{ label: "Pliométrie →", href: "/methodes/pliometrie" }]} />
      </LearnAccordion>

      {/* Résumé */}
      <div className="rounded-2xl border border-white/[0.06] dark:border-white/[0.06] bg-white/[0.03] dark:bg-white/[0.03] p-4">
        <p className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400 tracking-wide uppercase mb-3">EN RÉSUMÉ</p>
        <div className="flex flex-col gap-[6px]">
          <ComparisonRow type="Concentrique" movement="Se raccourcit" example="Montée curl" usage="Force, hypertrophie" color="#00E5FF" />
          <ComparisonRow type="Excentrique" movement="S’allonge" example="Descente squat" usage="Hypertrophie, force" color="#FF006E" />
          <ComparisonRow type="Isométrique" movement="Ne bouge pas" example="Planche" usage="Stabilité, gainage" color="#7B2FFF" />
          <ComparisonRow type="Pliométrique" movement="Étirement → explosion" example="Squat jump" usage="Puissance explosive" color="#f97316" />
        </div>
      </div>

      {/* Progression */}
      <LearnWarning>Quelle que soit la phase de contraction, la technique prime toujours sur la charge.</LearnWarning>
    </div>
  );
}
