"use client";

import { LearnParamGrid, LearnChargeReps, LearnThemeCard, LearnQuizCard } from "@/components/learn";

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400 tracking-wide uppercase mb-[10px]">
      {children}
    </p>
  );
}

export function ConnaissancesContent() {
  return (
    <div className="flex flex-col gap-6">
      {/* 1 — Les 6 paramètres */}
      <section>
        <SectionLabel>LES 6 PARAMÈTRES</SectionLabel>
        <LearnParamGrid params={[
          { value: "3×10", label: "Séries × reps" },
          { value: "70%", label: "Intensité" },
          { value: "60s", label: "Récupération" },
          { value: "40", label: "Volume total" },
          { value: "2-0-2", label: "Rythme" },
          { value: "1RM", label: "Charge max" },
        ]} />
      </section>

      {/* 2 — Charge / Reps */}
      <section>
        <SectionLabel>CHARGE / REPS</SectionLabel>
        <LearnChargeReps />
      </section>

      {/* 3 — Les 3 thèmes */}
      <section>
        <SectionLabel>LES 3 THÈMES</SectionLabel>
        <div className="flex flex-col gap-[8px]">
          <LearnThemeCard
            title="Endurance de force"
            subtitle="50-70% · 15-20 reps · 30-60s récup"
            color="green"
            description="Répéter des efforts musculaires sur la durée."
            methods={[
              { label: "Charge constante", href: "/methodes/charge-constante" },
              { label: "Circuit training", href: "/methodes/circuit-training" },
              { label: "AMRAP", href: "/methodes/amrap" },
              { label: "EMOM", href: "/methodes/emom" },
            ]}
          />
          <LearnThemeCard
            title="Gain de volume"
            subtitle="65-80% · 8-12 reps · 60-120s récup"
            color="blue"
            description="Hypertrophie — augmenter le volume des fibres musculaires."
            methods={[
              { label: "Drop set", href: "/methodes/drop-set" },
              { label: "Super set", href: "/methodes/super-set" },
              { label: "Série brûlante", href: "/methodes/serie-brulante" },
              { label: "Rest pause", href: "/methodes/rest-pause" },
            ]}
          />
          <LearnThemeCard
            title="Gain de puissance"
            subtitle="80-95% · 1-6 reps · 3-5 min récup"
            color="orange"
            description="Force explosive — force max en un minimum de temps."
            methods={[
              { label: "Bulgare", href: "/methodes/methode-bulgare" },
              { label: "Pliométrie", href: "/methodes/pliometrie" },
              { label: "Stato-dynamique", href: "/methodes/stato-dynamique" },
            ]}
          />
        </div>
      </section>

      {/* 4 — Quiz */}
      <section>
        <SectionLabel>QUEL THÈME POUR TOI ?</SectionLabel>
        <div className="flex flex-col gap-[6px]">
          <LearnQuizCard question="Tenir un effort longtemps ?" answer="Endurance" color="#22c55e" />
          <LearnQuizCard question="Muscles plus volumineux ?" answer="Volume" color="#3b82f6" />
          <LearnQuizCard question="Explosif et soulever lourd ?" answer="Puissance" color="#f97316" />
        </div>
      </section>
    </div>
  );
}
