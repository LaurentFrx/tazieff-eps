"use client";

import {
  LearnAccordion,
  LearnMiniCard,
  LearnWarning,
  LearnCorrectIncorrect,
  LearnMethodChips,
} from "@/components/learn";

/* ── Icons ── */

function IconCrosshair() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

function IconHeartbeat() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
    </svg>
  );
}

function IconLungs() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2c-1.5 2-3 4-3 6.5a5 5 0 0010 0C15 6 13.5 4 12 2c-1.5 2-3 4-3 6.5" /><path d="M12 10v12" /><path d="M8 14h8" />
    </svg>
  );
}

/* ── Tempo list item ── */

function TempoItem({ value, title, sub }: { value: string; title: string; sub: string }) {
  return (
    <div
      className="flex items-center gap-3 rounded-[10px] p-[10px_14px]"
      style={{ background: "rgba(255,0,110,0.04)", border: "1px solid rgba(255,0,110,0.08)" }}
    >
      <span className="font-mono text-[16px] font-medium min-w-[50px] text-[#ff4090]">{value}</span>
      <span className="min-w-0">
        <span className="block text-[12px] text-zinc-700 dark:text-zinc-300">{title}</span>
        <span className="block text-[11px] text-zinc-500">{sub}</span>
      </span>
    </div>
  );
}

/* ── Breathing card ── */

function BreathCard({ label, sub, color, down }: { label: string; sub: string; color: string; down: boolean }) {
  const rgb = color === "#00E5FF" ? "0,229,255" : "255,0,110";
  return (
    <div
      className="flex-1 rounded-xl p-[14px] text-center"
      style={{ background: `rgba(${rgb},0.05)`, border: `1px solid rgba(${rgb},0.1)` }}
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-[6px]">
        {down ? (
          <><path d="M12 5v14" /><path d="M19 12l-7 7-7-7" /></>
        ) : (
          <><path d="M12 19V5" /><path d="M5 12l7-7 7 7" /></>
        )}
      </svg>
      <p className="text-[14px] font-medium" style={{ color }}>{label}</p>
      <p className="text-[11px] text-zinc-500">{sub}</p>
    </div>
  );
}

/* ── Main ── */

export function TechniquesContent() {
  return (
    <div className="flex flex-col gap-3">
      {/* 1 — Placements */}
      <LearnAccordion title="Placements et postures" subtitle="Dos · regard · appuis · genoux" icon={<IconCrosshair />} accentColor="#00E5FF">
        <div className="grid grid-cols-2 gap-2">
          <LearnMiniCard label="Dos" accentColor="#00E5FF">Courbures naturelles. Jamais arrondi sous charge.</LearnMiniCard>
          <LearnMiniCard label="Regard" accentColor="#00E5FF">Fixe, horizontal. Stabilise la colonne.</LearnMiniCard>
          <LearnMiniCard label="Appuis" accentColor="#00E5FF">Pieds largeur d&apos;épaules, poids talon + avant-pied.</LearnMiniCard>
          <LearnMiniCard label="Genoux" accentColor="#00E5FF">Axe des pieds. Pas de valgus au squat.</LearnMiniCard>
        </div>
        <LearnWarning>Si le placement se dégrade, la charge est trop lourde. Diminue-la.</LearnWarning>
        <LearnMethodChips accentColor="#00E5FF" methods={[{ label: "Sécurité →", href: "/apprendre/securite" }]} />
      </LearnAccordion>

      {/* 2 — Trajectoires */}
      <LearnAccordion title="Trajectoires motrices" subtitle="Amplitude · contrôle · symétrie" icon={<IconHeartbeat />} accentColor="#7B2FFF">
        <LearnCorrectIncorrect items={[
          { label: "Amplitude", correct: "Complète", incorrect: "Partielle" },
          { label: "Trajectoire", correct: "Fluide", incorrect: "Élan" },
          { label: "Excentrique", correct: "Lente 2-4s", incorrect: "Chute libre" },
          { label: "Symétrie", correct: "Effort égal", incorrect: "Compensation" },
        ]} />
        <LearnMethodChips accentColor="#7B2FFF" methods={[{ label: "Contractions →", href: "/apprendre/contractions" }]} />
      </LearnAccordion>

      {/* 3 — Rythme */}
      <LearnAccordion title="Rythme du mouvement" subtitle="Tempo · charge/vitesse" icon={<IconClock />} accentColor="#FF006E">
        <div className="flex flex-col gap-[6px]">
          <TempoItem value="2-0-2" title="Standard polyvalent" sub="2s montée · 0 pause · 2s descente" />
          <TempoItem value="1-0-3" title="Accent excentrique" sub="Hypertrophie — descente lente" />
          <TempoItem value="2-2-2" title="Stato-dynamique" sub="Pause isométrique — force" />
        </div>
        <LearnMethodChips accentColor="#FF006E" methods={[
          { label: "Stato-dynamique →", href: "/methodes/stato-dynamique" },
          { label: "Pliométrie →", href: "/methodes/pliometrie" },
        ]} />
      </LearnAccordion>

      {/* 4 — Respiration */}
      <LearnAccordion title="Respiration" subtitle="Inspirer · expirer · Valsalva" icon={<IconLungs />} accentColor="#00E5FF">
        <div className="flex gap-2">
          <BreathCard label="Inspirer" sub="Excentrique (descente)" color="#00E5FF" down />
          <BreathCard label="Expirer" sub="Concentrique (effort)" color="#FF006E" down={false} />
        </div>
        <LearnWarning>Valsalva : Terminales uniquement, toujours avec pareur. Jamais sur plusieurs reps.</LearnWarning>
      </LearnAccordion>
    </div>
  );
}
