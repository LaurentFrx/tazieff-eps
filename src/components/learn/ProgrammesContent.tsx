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
          Un programme hebdomadaire structure ton entraînement : il répartit les groupes musculaires, garantit la récupération, et évite les déséquilibres. Ces 3 exemples sont des <strong className="text-zinc-800 dark:text-zinc-200">points de départ</strong> — adapte-les à ton objectif.
        </p>
      </div>

      {/* 1 — Renforcement */}
      <LearnAccordion title="Renforcement et tonification" subtitle="3 séances · polyvalent · débutant-intermédiaire" icon={<IconDumbbell />} accentColor="#00E5FF">
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug mb-2">Hypertrophie + endurance de force — galber les membres inférieurs, tonifier le dos, renforcer le centre. Récup 1 min à 1 min 30.</p>
        <LearnWeekProgram accentColor="#00E5FF" sessions={[
          { day: "LUN", title: "Séance A — Bas du corps", detail: "Squat 3×10-12 · Hip Thrust 3×10-12 · Fentes 3×10 · Soulevé de terre 3×10 · Gainage 3×30s" },
          { day: "MER", title: "Séance B — Haut du corps", detail: "Tirage horizontal 3×10-12 · Dév. épaules 3×10 · Tirage vertical 3×10 · Pompes 2-3×8-10 · Curls 2×12" },
          { day: "VEN", title: "Séance C — Bas du corps + Abdos", detail: "Goblet squat 3×12 · Step up 3×10 · Abduction 3×15 · Leg curl 3×12 · Gainage dynamique 3×30s" },
        ]} />
        <LearnMethodChips accentColor="#00E5FF" methods={[
          { label: "Charge constante", href: "/methodes/charge-constante" },
          { label: "Pyramide", href: "/methodes/pyramide" },
        ]} />
      </LearnAccordion>

      {/* 2 — Perte de gras */}
      <LearnAccordion title="Perte de gras" subtitle="4 séances · cardio + muscu · intermédiaire" icon={<IconFlame />} accentColor="#FF006E">
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug mb-2">Dépense énergétique max + maintien masse musculaire. Tu dois finir essoufflé mais capable de parler.</p>
        <LearnWeekProgram accentColor="#FF006E" sessions={[
          { day: "LUN", title: "Bas du corps & Cardio", detail: "Bloc A : Goblet Squat ×12, Fentes ×12, Hip Thrust ×15 (4 tours) · Bloc B : Swings ×20, Mountain Climbers 30s, Gainage 30s (4 tours)" },
          { day: "MAR", title: "Haut du corps & Torse", detail: "Bloc A : Pompes ×15, Dév. kettlebell ×12, Dips ×12 (4 tours) · Bloc B : Rowing ×12, Curls ×12, Gainage lat. 30s (4 tours)" },
          { day: "JEU", title: "Full Body Brûleur", detail: "Circuit 5 tours : Swings ×15, Squat Thruster ×12, Rowing ×12, Pompes ×12, Russian Twist ×20" },
          { day: "SAM", title: "Spécial 20 min (option)", detail: "Format 30/30 en boucle : Swings, Jumping Jacks, Squats, Mountain Climbers, Gainage" },
        ]} />
        <LearnWarning>Zone idéale : essoufflé mais capable de parler. Si tu ne peux plus parler, ralentis.</LearnWarning>
        <LearnMethodChips accentColor="#FF006E" methods={[
          { label: "Circuit training", href: "/methodes/circuit-training" },
          { label: "AMRAP", href: "/methodes/amrap" },
        ]} />
      </LearnAccordion>

      {/* 3 — Calisthénie */}
      <LearnAccordion title="Calisthénie (poids de corps)" subtitle="3 séances · sans matériel · tous niveaux" icon={<IconBody />} accentColor="#7B2FFF">
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug mb-2">Force relative et contrôle du corps. 3 piliers : tension mécanique, isométrie, excentrique.</p>
        <LearnWeekProgram accentColor="#7B2FFF" sessions={[
          { day: "LUN", title: "Pilier 1 — Tension mécanique", detail: "Tractions 4-5×3-8 · Dips lestés 4-5×3-8 · Pompes déclinées · Pistol squats · Récup 3-4 min" },
          { day: "MER", title: "Pilier 2 — Isométrie", detail: "Hollow body 3-5×10-30s · Planche lean · Front lever tuck · Handstand hold · L-Sit · Récup 2-3 min" },
          { day: "VEN", title: "Pilier 3 — Excentrique", detail: "Tractions négatives 5-10s · Dips profonds descente 4s · Handstand push-up négatif · Front lever négatif · Récup 3 min" },
        ]} />
        <LearnMethodChips accentColor="#7B2FFF" methods={[
          { label: "Stato-dynamique", href: "/methodes/stato-dynamique" },
          { label: "Pliométrie", href: "/methodes/pliometrie" },
        ]} />
      </LearnAccordion>

      {/* Comment construire */}
      <div className="rounded-2xl border border-white/[0.06] dark:border-white/[0.06] bg-white/[0.03] dark:bg-white/[0.03] p-4">
        <p className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400 tracking-wide uppercase mb-3">CONSTRUIRE TON PROGRAMME</p>
        <div className="flex flex-col gap-[6px] text-[12px] text-zinc-600 dark:text-zinc-400 leading-snug">
          <p><strong className="text-zinc-800 dark:text-zinc-200">1.</strong> Choisis ton objectif → endurance, perte de gras ou force</p>
          <p><strong className="text-zinc-800 dark:text-zinc-200">2.</strong> Répartis 3+ séances/semaine, pas deux jours de suite sur les mêmes muscles</p>
          <p><strong className="text-zinc-800 dark:text-zinc-200">3.</strong> Polyarticulaires en premier, isolation en finition</p>
          <p><strong className="text-zinc-800 dark:text-zinc-200">4.</strong> Applique une méthode : charge constante, pyramide, drop set…</p>
          <p><strong className="text-zinc-800 dark:text-zinc-200">5.</strong> Note tes performances au carnet d&apos;entraînement</p>
        </div>
        <div className="mt-3">
          <LearnMethodChips accentColor="#00E5FF" methods={[
            { label: "Toutes les méthodes →", href: "/methodes" },
            { label: "RM/RIR/RPE →", href: "/apprendre/rm-rir-rpe" },
          ]} />
        </div>
      </div>
    </div>
  );
}
