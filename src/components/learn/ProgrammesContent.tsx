"use client";

import { LearnAccordion, LearnWarning, LearnMethodChips } from "@/components/learn";
import { LearnWeekProgram } from "./LearnWeekProgram";

/* ── Icons ── */
function IconDumbbell() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 6.5L17.5 17.5" /><path d="M3.5 10L10 3.5" /><path d="M14 20.5L20.5 14" /><path d="M2 11.5l1.5-1.5" /><path d="M20.5 13L22 11.5" />
    </svg>
  );
}
function IconFlame() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2c-1 4-4 6-4 10a4 4 0 008 0c0-4-3-6-4-10z" />
    </svg>
  );
}
function IconBody() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="3" /><path d="M12 10c-4 0-7 2-7 4v2h14v-2c0-2-3-4-7-4z" />
    </svg>
  );
}

/* ── Main ── */
export function ProgrammesContent() {
  return (
    <div className="flex flex-col gap-3">
      {/* Intro */}
      <div className="rounded-2xl border border-white/[0.06] dark:border-white/[0.06] bg-white/[0.03] dark:bg-white/[0.03] p-4">
        <p className="text-[13px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Un programme hebdomadaire structure ton entra\u00eenement : il r\u00e9partit les groupes musculaires, garantit la r\u00e9cup\u00e9ration, et \u00e9vite les d\u00e9s\u00e9quilibres. Ces 3 exemples sont des <strong className="text-zinc-800 dark:text-zinc-200">points de d\u00e9part</strong> \u2014 adapte-les \u00e0 ton objectif.
        </p>
      </div>

      {/* 1 — Renforcement */}
      <LearnAccordion title="Renforcement et tonification" subtitle="3 s\u00e9ances \u00b7 polyvalent \u00b7 d\u00e9butant-interm\u00e9diaire" icon={<IconDumbbell />} accentColor="#00E5FF">
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug mb-2">Hypertrophie + endurance de force \u2014 galber les membres inf\u00e9rieurs, tonifier le dos, renforcer le centre. R\u00e9cup 1 min \u00e0 1 min 30.</p>
        <LearnWeekProgram accentColor="#00E5FF" sessions={[
          { day: "LUN", title: "S\u00e9ance A \u2014 Bas du corps", detail: "Squat 3\u00d710-12 \u00b7 Hip Thrust 3\u00d710-12 \u00b7 Fentes 3\u00d710 \u00b7 Soulev\u00e9 de terre 3\u00d710 \u00b7 Gainage 3\u00d730s" },
          { day: "MER", title: "S\u00e9ance B \u2014 Haut du corps", detail: "Tirage horizontal 3\u00d710-12 \u00b7 D\u00e9v. \u00e9paules 3\u00d710 \u00b7 Tirage vertical 3\u00d710 \u00b7 Pompes 2-3\u00d78-10 \u00b7 Curls 2\u00d712" },
          { day: "VEN", title: "S\u00e9ance C \u2014 Bas du corps + Abdos", detail: "Goblet squat 3\u00d712 \u00b7 Step up 3\u00d710 \u00b7 Abduction 3\u00d715 \u00b7 Leg curl 3\u00d712 \u00b7 Gainage dynamique 3\u00d730s" },
        ]} />
        <LearnMethodChips accentColor="#00E5FF" methods={[
          { label: "Charge constante", href: "/methodes/charge-constante" },
          { label: "Pyramide", href: "/methodes/pyramide" },
        ]} />
      </LearnAccordion>

      {/* 2 — Perte de gras */}
      <LearnAccordion title="Perte de gras" subtitle="4 s\u00e9ances \u00b7 cardio + muscu \u00b7 interm\u00e9diaire" icon={<IconFlame />} accentColor="#FF006E">
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug mb-2">D\u00e9pense \u00e9nerg\u00e9tique max + maintien masse musculaire. Tu dois finir essouffl\u00e9 mais capable de parler.</p>
        <LearnWeekProgram accentColor="#FF006E" sessions={[
          { day: "LUN", title: "Bas du corps & Cardio", detail: "Bloc A : Goblet Squat \u00d712, Fentes \u00d712, Hip Thrust \u00d715 (4 tours) \u00b7 Bloc B : Swings \u00d720, Mountain Climbers 30s, Gainage 30s (4 tours)" },
          { day: "MAR", title: "Haut du corps & Torse", detail: "Bloc A : Pompes \u00d715, D\u00e9v. kettlebell \u00d712, Dips \u00d712 (4 tours) \u00b7 Bloc B : Rowing \u00d712, Curls \u00d712, Gainage lat. 30s (4 tours)" },
          { day: "JEU", title: "Full Body Br\u00fbleur", detail: "Circuit 5 tours : Swings \u00d715, Squat Thruster \u00d712, Rowing \u00d712, Pompes \u00d712, Russian Twist \u00d720" },
          { day: "SAM", title: "Sp\u00e9cial 20 min (option)", detail: "Format 30/30 en boucle : Swings, Jumping Jacks, Squats, Mountain Climbers, Gainage" },
        ]} />
        <LearnWarning>Zone id\u00e9ale : essouffl\u00e9 mais capable de parler. Si tu ne peux plus parler, ralentis.</LearnWarning>
        <LearnMethodChips accentColor="#FF006E" methods={[
          { label: "Circuit training", href: "/methodes/circuit-training" },
          { label: "AMRAP", href: "/methodes/amrap" },
        ]} />
      </LearnAccordion>

      {/* 3 — Calisthénie */}
      <LearnAccordion title="Calisth\u00e9nie (poids de corps)" subtitle="3 s\u00e9ances \u00b7 sans mat\u00e9riel \u00b7 tous niveaux" icon={<IconBody />} accentColor="#7B2FFF">
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug mb-2">Force relative et contr\u00f4le du corps. 3 piliers : tension m\u00e9canique, isom\u00e9trie, excentrique.</p>
        <LearnWeekProgram accentColor="#7B2FFF" sessions={[
          { day: "LUN", title: "Pilier 1 \u2014 Tension m\u00e9canique", detail: "Tractions 4-5\u00d73-8 \u00b7 Dips lest\u00e9s 4-5\u00d73-8 \u00b7 Pompes d\u00e9clin\u00e9es \u00b7 Pistol squats \u00b7 R\u00e9cup 3-4 min" },
          { day: "MER", title: "Pilier 2 \u2014 Isom\u00e9trie", detail: "Hollow body 3-5\u00d710-30s \u00b7 Planche lean \u00b7 Front lever tuck \u00b7 Handstand hold \u00b7 L-Sit \u00b7 R\u00e9cup 2-3 min" },
          { day: "VEN", title: "Pilier 3 \u2014 Excentrique", detail: "Tractions n\u00e9gatives 5-10s \u00b7 Dips profonds descente 4s \u00b7 Handstand push-up n\u00e9gatif \u00b7 Front lever n\u00e9gatif \u00b7 R\u00e9cup 3 min" },
        ]} />
        <LearnMethodChips accentColor="#7B2FFF" methods={[
          { label: "Stato-dynamique", href: "/methodes/stato-dynamique" },
          { label: "Pliom\u00e9trie", href: "/methodes/pliometrie" },
        ]} />
      </LearnAccordion>

      {/* Comment construire */}
      <div className="rounded-2xl border border-white/[0.06] dark:border-white/[0.06] bg-white/[0.03] dark:bg-white/[0.03] p-4">
        <p className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400 tracking-wide uppercase mb-3">CONSTRUIRE TON PROGRAMME</p>
        <div className="flex flex-col gap-[6px] text-[12px] text-zinc-600 dark:text-zinc-400 leading-snug">
          <p><strong className="text-zinc-800 dark:text-zinc-200">1.</strong> Choisis ton objectif \u2192 endurance, perte de gras ou force</p>
          <p><strong className="text-zinc-800 dark:text-zinc-200">2.</strong> R\u00e9partis 3+ s\u00e9ances/semaine, pas deux jours de suite sur les m\u00eames muscles</p>
          <p><strong className="text-zinc-800 dark:text-zinc-200">3.</strong> Polyarticulaires en premier, isolation en finition</p>
          <p><strong className="text-zinc-800 dark:text-zinc-200">4.</strong> Applique une m\u00e9thode : charge constante, pyramide, drop set\u2026</p>
          <p><strong className="text-zinc-800 dark:text-zinc-200">5.</strong> Note tes performances au carnet d&apos;entra\u00eenement</p>
        </div>
        <div className="mt-3">
          <LearnMethodChips accentColor="#00E5FF" methods={[
            { label: "Toutes les m\u00e9thodes \u2192", href: "/methodes" },
            { label: "RM/RIR/RPE \u2192", href: "/apprendre/rm-rir-rpe" },
          ]} />
        </div>
      </div>
    </div>
  );
}
