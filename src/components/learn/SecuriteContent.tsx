"use client";

import { LearnAccordion, LearnNumberBadge, LearnMiniCard, LearnWarning, LearnMethodChips } from "@/components/learn";

const CYAN = "#00E5FF";

/* ── Main ── */

export function SecuriteContent() {
  return (
    <div className="flex flex-col gap-3">
      {/* Intro */}
      <div className="rounded-2xl border border-white/[0.06] dark:border-white/[0.06] bg-white/[0.03] dark:bg-white/[0.03] p-4">
        <p className="text-[13px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Une technique incorrecte sous charge peut provoquer des blessures graves. Ces 6 principes s&apos;appliquent à <strong className="text-zinc-800 dark:text-zinc-200">chaque exercice, chaque série, chaque répétition</strong>.
        </p>
        <LearnWarning>Si tu ne peux pas maintenir ces principes, la charge est trop lourde. Diminue-la.</LearnWarning>
      </div>

      {/* 1 — Dos */}
      <LearnAccordion
        title="Placement optimal du dos"
        subtitle="Gainage · colonne neutre · contact support"
        icon={<LearnNumberBadge number={1} accentColor={CYAN} />}
        accentColor={CYAN}
      >
        <div className="grid grid-cols-2 gap-2">
          <LearnMiniCard label="Dos plat (debout)" accentColor={CYAN}>Colonne neutre, gainage actif. Squat, rowing, soulevé de terre.</LearnMiniCard>
          <LearnMiniCard label="Dos collé (assis)" accentColor={CYAN}>Dos entier au banc, pas d&apos;arc excessif. Développé couché, leg press.</LearnMiniCard>
        </div>
        <LearnWarning>Ne jamais arrondir le bas du dos sous charge ni relâcher le gainage en fin de série.</LearnWarning>
      </LearnAccordion>

      {/* 2 — Respiration */}
      <LearnAccordion
        title="Maîtrise du cycle respiratoire"
        subtitle="Expiration à l’effort · stabilité du tronc"
        icon={<LearnNumberBadge number={2} accentColor={CYAN} />}
        accentColor={CYAN}
      >
        <div className="grid grid-cols-2 gap-2">
          <LearnMiniCard label="Inspirer" accentColor={CYAN}>Phase excentrique (descente, étirement).</LearnMiniCard>
          <LearnMiniCard label="Expirer" accentColor={CYAN}>Phase concentrique (poussée, traction, effort).</LearnMiniCard>
        </div>
        <LearnWarning>Ne jamais bloquer la respiration sur plusieurs répétitions (risque de malaise).</LearnWarning>
      </LearnAccordion>

      {/* 3 — Angles */}
      <LearnAccordion
        title="Respect des angles articulaires"
        subtitle="90° maximum · genoux · coudes · épaules"
        icon={<LearnNumberBadge number={3} accentColor={CYAN} />}
        accentColor={CYAN}
      >
        <div className="flex flex-col gap-[6px]">
          <LearnMiniCard label="Genou" accentColor={CYAN}>Descente 90° max (cuisses parallèles). Genoux dans l&apos;axe des pieds.</LearnMiniCard>
          <LearnMiniCard label="Coude" accentColor={CYAN}>Pas d&apos;hyper-extension. Amplitude complète mais contrôlée.</LearnMiniCard>
          <LearnMiniCard label="Épaule" accentColor={CYAN}>Coudes sous les épaules. Éviter les angles douloureux.</LearnMiniCard>
        </div>
        <LearnWarning>Ne jamais descendre plus bas que nécessaire pour « impressionner ».</LearnWarning>
      </LearnAccordion>

      {/* 4 — Regard */}
      <LearnAccordion
        title="Orientation stratégique du regard"
        subtitle="Horizon · colonne alignée"
        icon={<LearnNumberBadge number={4} accentColor={CYAN} />}
        accentColor={CYAN}
      >
        <div className="flex flex-col gap-[6px]">
          <LearnMiniCard label="Squat / Soulevé de terre" accentColor={CYAN}>Regard horizontal, droit devant.</LearnMiniCard>
          <LearnMiniCard label="Développé couché" accentColor={CYAN}>Regard vers le plafond, yeux sous la barre.</LearnMiniCard>
          <LearnMiniCard label="Rowing" accentColor={CYAN}>Regard vers le sol, 45° devant.</LearnMiniCard>
        </div>
        <LearnWarning>Ne pas regarder ses pieds (flexion du tronc) ni forcer le regard en l&apos;air (cervicales).</LearnWarning>
      </LearnAccordion>

      {/* 5 — Cale */}
      <LearnAccordion
        title="Utilisation d’une cale au squat"
        subtitle="Mobilité cheville · talons surélevés"
        icon={<LearnNumberBadge number={5} accentColor={CYAN} />}
        accentColor={CYAN}
      >
        <div className="grid grid-cols-2 gap-2">
          <LearnMiniCard label="Quand ?" accentColor={CYAN}>Talons qui décollent, buste trop incliné, apprentissage.</LearnMiniCard>
          <LearnMiniCard label="Pourquoi ?" accentColor={CYAN}>Buste plus vertical, moins de contraintes genoux et dos.</LearnMiniCard>
        </div>
        <LearnWarning>La cale est un outil pédagogique et préventif, pas une faiblesse.</LearnWarning>
      </LearnAccordion>

      {/* 6 — Partenaire */}
      <LearnAccordion
        title="Rôle du partenaire"
        subtitle="Observer · compter · conseiller · protéger"
        icon={<LearnNumberBadge number={6} accentColor={CYAN} />}
        accentColor={CYAN}
      >
        <div className="flex flex-col gap-[6px]">
          <LearnMiniCard label="Seconde" accentColor={CYAN}>Manipuler les charges avec soin, remettre en ordre, être attentif.</LearnMiniCard>
          <LearnMiniCard label="Première" accentColor={CYAN}>Compter les reps, observer et conseiller la technique.</LearnMiniCard>
          <LearnMiniCard label="Terminale" accentColor={CYAN}>Optimiser la charge en temps réel, identifier les manquements, coacher.</LearnMiniCard>
        </div>
        <LearnWarning>Sur le développé couché et squat lourds : pareur en position, mains sous la barre.</LearnWarning>
        <LearnMethodChips accentColor={CYAN} methods={[
          { label: "Techniques d’entraînement →", href: "/apprendre/techniques" },
        ]} />
      </LearnAccordion>
    </div>
  );
}
