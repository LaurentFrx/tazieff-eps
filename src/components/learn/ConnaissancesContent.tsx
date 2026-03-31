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
        <SectionLabel>LES 6 PARAM\u00c8TRES</SectionLabel>
        <LearnParamGrid params={[
          { value: "3\u00d710", label: "S\u00e9ries \u00d7 reps" },
          { value: "70%", label: "Intensit\u00e9" },
          { value: "60s", label: "R\u00e9cup\u00e9ration" },
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
        <SectionLabel>LES 3 TH\u00c8MES</SectionLabel>
        <div className="flex flex-col gap-[8px]">
          <LearnThemeCard
            title="Endurance de force"
            subtitle="50-70% \u00b7 15-20 reps \u00b7 30-60s r\u00e9cup"
            color="green"
            description="R\u00e9p\u00e9ter des efforts musculaires sur la dur\u00e9e."
            methods={[
              { label: "Charge constante", href: "/methodes/charge-constante" },
              { label: "Circuit training", href: "/methodes/circuit-training" },
              { label: "AMRAP", href: "/methodes/amrap" },
              { label: "EMOM", href: "/methodes/emom" },
            ]}
          />
          <LearnThemeCard
            title="Gain de volume"
            subtitle="65-80% \u00b7 8-12 reps \u00b7 60-120s r\u00e9cup"
            color="blue"
            description="Hypertrophie \u2014 augmenter le volume des fibres musculaires."
            methods={[
              { label: "Drop set", href: "/methodes/drop-set" },
              { label: "Super set", href: "/methodes/super-set" },
              { label: "S\u00e9rie br\u00fblante", href: "/methodes/serie-brulante" },
              { label: "Rest pause", href: "/methodes/rest-pause" },
            ]}
          />
          <LearnThemeCard
            title="Gain de puissance"
            subtitle="80-95% \u00b7 1-6 reps \u00b7 3-5 min r\u00e9cup"
            color="orange"
            description="Force explosive \u2014 force max en un minimum de temps."
            methods={[
              { label: "Bulgare", href: "/methodes/methode-bulgare" },
              { label: "Pliom\u00e9trie", href: "/methodes/pliometrie" },
              { label: "Stato-dynamique", href: "/methodes/stato-dynamique" },
            ]}
          />
        </div>
      </section>

      {/* 4 — Quiz */}
      <section>
        <SectionLabel>QUEL TH\u00c8ME POUR TOI ?</SectionLabel>
        <div className="flex flex-col gap-[6px]">
          <LearnQuizCard question="Tenir un effort longtemps ?" answer="Endurance" color="#22c55e" />
          <LearnQuizCard question="Muscles plus volumineux ?" answer="Volume" color="#3b82f6" />
          <LearnQuizCard question="Explosif et soulever lourd ?" answer="Puissance" color="#f97316" />
        </div>
      </section>
    </div>
  );
}
