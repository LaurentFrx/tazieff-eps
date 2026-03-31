"use client";

import { LearnAccordion, LearnParamTable, LearnMethodChips, LearnWarning } from "@/components/learn";

/* ── Icons ── */

function IconVolume() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 6.5L17.5 17.5" /><path d="M3.5 10L10 3.5" /><path d="M14 20.5L20.5 14" /><path d="M2 11.5l1.5-1.5" /><path d="M20.5 13L22 11.5" />
    </svg>
  );
}

function IconEndurance() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

function IconPower() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function IconMethods() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 7h6" /><path d="M9 11h6" /><path d="M9 15h4" />
    </svg>
  );
}

/* ── Main ── */

export function ParametresContent() {
  return (
    <div className="flex flex-col gap-3">
      {/* Volume / Hypertrophie */}
      <LearnAccordion
        title="Gain de volume (hypertrophie)"
        subtitle="65-75% 1RM \u00b7 8-12 reps \u00b7 6-10 s\u00e9ries"
        icon={<IconVolume />}
        accentColor="#3b82f6"
      >
        <LearnParamTable rows={[
          { param: "Charge", value: "65-75% du 1RM" },
          { param: "R\u00e9p\u00e9titions", value: "8-12" },
          { param: "S\u00e9ries", value: "6-10" },
          { param: "R\u00e9cup\u00e9ration", value: "1 min 30 \u00e0 2 min" },
          { param: "Vitesse", value: "Lente et contr\u00f4l\u00e9e" },
        ]} />
        <LearnWarning>Maintenez une contraction constante durant tout le mouvement.</LearnWarning>
        <LearnMethodChips accentColor="#3b82f6" methods={[
          { label: "Drop-set", href: "/methodes/drop-set" },
          { label: "Rest-pause", href: "/methodes/rest-pause" },
          { label: "Super-set", href: "/methodes/super-set" },
          { label: "S\u00e9rie br\u00fblante", href: "/methodes/serie-brulante" },
          { label: "Pr\u00e9-activation", href: "/methodes/pre-activation" },
        ]} />
      </LearnAccordion>

      {/* Endurance */}
      <LearnAccordion
        title="Endurance de force"
        subtitle="30-60% 1RM \u00b7 15-30 reps \u00b7 30-60s r\u00e9cup"
        icon={<IconEndurance />}
        accentColor="#22c55e"
      >
        <LearnParamTable rows={[
          { param: "Charge", value: "30-60% du 1RM" },
          { param: "R\u00e9p\u00e9titions", value: "15-30" },
          { param: "R\u00e9cup\u00e9ration", value: "30-60 secondes" },
          { param: "Rythme", value: "Contr\u00f4l\u00e9, 1-2 sec" },
        ]} />
        <LearnMethodChips accentColor="#22c55e" methods={[
          { label: "Circuit training", href: "/methodes/circuit-training" },
          { label: "Pyramide", href: "/methodes/pyramide" },
          { label: "AMRAP", href: "/methodes/amrap" },
          { label: "EMOM", href: "/methodes/emom" },
        ]} />
      </LearnAccordion>

      {/* Puissance */}
      <LearnAccordion
        title="Gain de puissance"
        subtitle="80-95% 1RM \u00b7 1-6 reps \u00b7 3-5 min r\u00e9cup"
        icon={<IconPower />}
        accentColor="#f97316"
      >
        <LearnParamTable rows={[
          { param: "Charge", value: "80-95% du 1RM" },
          { param: "R\u00e9p\u00e9titions", value: "1-6" },
          { param: "S\u00e9ries", value: "4-6" },
          { param: "R\u00e9cup\u00e9ration", value: "3-5 minutes" },
          { param: "Vitesse", value: "Explosive (concentrique)" },
        ]} />
        <LearnWarning>Poussez ou tirez le plus vite possible, contr\u00f4lez la descente.</LearnWarning>
        <LearnMethodChips accentColor="#f97316" methods={[
          { label: "Bulgare", href: "/methodes/methode-bulgare" },
          { label: "Pliom\u00e9trie", href: "/methodes/pliometrie" },
          { label: "Stato-dynamique", href: "/methodes/stato-dynamique" },
        ]} />
      </LearnAccordion>

      {/* Méthodes */}
      <LearnAccordion
        title="M\u00e9thodes d\u2019entra\u00eenement cit\u00e9es"
        subtitle="Volume \u00b7 endurance \u00b7 m\u00e9thodes associ\u00e9es"
        icon={<IconMethods />}
        accentColor="#7B2FFF"
      >
        <p className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400 tracking-wide uppercase">HYPERTROPHIE</p>
        <LearnMethodChips accentColor="#3b82f6" methods={[
          { label: "Pr\u00e9-fatigue", href: "/methodes/pre-activation" },
          { label: "Drop-set", href: "/methodes/drop-set" },
          { label: "Rest-pause", href: "/methodes/rest-pause" },
          { label: "S\u00e9rie br\u00fblante", href: "/methodes/serie-brulante" },
          { label: "Super-set", href: "/methodes/super-set" },
        ]} />
        <p className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400 tracking-wide uppercase mt-2">ENDURANCE</p>
        <LearnMethodChips accentColor="#22c55e" methods={[
          { label: "Circuit training", href: "/methodes/circuit-training" },
          { label: "Pyramide", href: "/methodes/pyramide" },
          { label: "D\u00e9fi centurion", href: "/methodes/defi-centurion" },
          { label: "Triple-tri-set", href: "/methodes/triple-tri-set" },
        ]} />
      </LearnAccordion>
    </div>
  );
}
