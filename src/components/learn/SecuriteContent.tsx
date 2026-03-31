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
          Une technique incorrecte sous charge peut provoquer des blessures graves. Ces 6 principes s&apos;appliquent \u00e0 <strong className="text-zinc-800 dark:text-zinc-200">chaque exercice, chaque s\u00e9rie, chaque r\u00e9p\u00e9tition</strong>.
        </p>
        <LearnWarning>Si tu ne peux pas maintenir ces principes, la charge est trop lourde. Diminue-la.</LearnWarning>
      </div>

      {/* 1 — Dos */}
      <LearnAccordion
        title="Placement optimal du dos"
        subtitle="Gainage \u00b7 colonne neutre \u00b7 contact support"
        icon={<LearnNumberBadge number={1} accentColor={CYAN} />}
        accentColor={CYAN}
      >
        <div className="grid grid-cols-2 gap-2">
          <LearnMiniCard label="Dos plat (debout)" accentColor={CYAN}>Colonne neutre, gainage actif. Squat, rowing, soulev\u00e9 de terre.</LearnMiniCard>
          <LearnMiniCard label="Dos coll\u00e9 (assis)" accentColor={CYAN}>Dos entier au banc, pas d&apos;arc excessif. D\u00e9velopp\u00e9 couch\u00e9, leg press.</LearnMiniCard>
        </div>
        <LearnWarning>Ne jamais arrondir le bas du dos sous charge ni rel\u00e2cher le gainage en fin de s\u00e9rie.</LearnWarning>
      </LearnAccordion>

      {/* 2 — Respiration */}
      <LearnAccordion
        title="Ma\u00eetrise du cycle respiratoire"
        subtitle="Expiration \u00e0 l\u2019effort \u00b7 stabilit\u00e9 du tronc"
        icon={<LearnNumberBadge number={2} accentColor={CYAN} />}
        accentColor={CYAN}
      >
        <div className="grid grid-cols-2 gap-2">
          <LearnMiniCard label="Inspirer" accentColor={CYAN}>Phase excentrique (descente, \u00e9tirement).</LearnMiniCard>
          <LearnMiniCard label="Expirer" accentColor={CYAN}>Phase concentrique (pouss\u00e9e, traction, effort).</LearnMiniCard>
        </div>
        <LearnWarning>Ne jamais bloquer la respiration sur plusieurs r\u00e9p\u00e9titions (risque de malaise).</LearnWarning>
      </LearnAccordion>

      {/* 3 — Angles */}
      <LearnAccordion
        title="Respect des angles articulaires"
        subtitle="90\u00b0 maximum \u00b7 genoux \u00b7 coudes \u00b7 \u00e9paules"
        icon={<LearnNumberBadge number={3} accentColor={CYAN} />}
        accentColor={CYAN}
      >
        <div className="flex flex-col gap-[6px]">
          <LearnMiniCard label="Genou" accentColor={CYAN}>Descente 90\u00b0 max (cuisses parall\u00e8les). Genoux dans l&apos;axe des pieds.</LearnMiniCard>
          <LearnMiniCard label="Coude" accentColor={CYAN}>Pas d&apos;hyper-extension. Amplitude compl\u00e8te mais contr\u00f4l\u00e9e.</LearnMiniCard>
          <LearnMiniCard label="\u00c9paule" accentColor={CYAN}>Coudes sous les \u00e9paules. \u00c9viter les angles douloureux.</LearnMiniCard>
        </div>
        <LearnWarning>Ne jamais descendre plus bas que n\u00e9cessaire pour \u00ab\u00a0impressionner\u00a0\u00bb.</LearnWarning>
      </LearnAccordion>

      {/* 4 — Regard */}
      <LearnAccordion
        title="Orientation strat\u00e9gique du regard"
        subtitle="Horizon \u00b7 colonne align\u00e9e"
        icon={<LearnNumberBadge number={4} accentColor={CYAN} />}
        accentColor={CYAN}
      >
        <div className="flex flex-col gap-[6px]">
          <LearnMiniCard label="Squat / Soulev\u00e9 de terre" accentColor={CYAN}>Regard horizontal, droit devant.</LearnMiniCard>
          <LearnMiniCard label="D\u00e9velopp\u00e9 couch\u00e9" accentColor={CYAN}>Regard vers le plafond, yeux sous la barre.</LearnMiniCard>
          <LearnMiniCard label="Rowing" accentColor={CYAN}>Regard vers le sol, 45\u00b0 devant.</LearnMiniCard>
        </div>
        <LearnWarning>Ne pas regarder ses pieds (flexion du tronc) ni forcer le regard en l&apos;air (cervicales).</LearnWarning>
      </LearnAccordion>

      {/* 5 — Cale */}
      <LearnAccordion
        title="Utilisation d\u2019une cale au squat"
        subtitle="Mobilit\u00e9 cheville \u00b7 talons sur\u00e9lev\u00e9s"
        icon={<LearnNumberBadge number={5} accentColor={CYAN} />}
        accentColor={CYAN}
      >
        <div className="grid grid-cols-2 gap-2">
          <LearnMiniCard label="Quand ?" accentColor={CYAN}>Talons qui d\u00e9collent, buste trop inclin\u00e9, apprentissage.</LearnMiniCard>
          <LearnMiniCard label="Pourquoi ?" accentColor={CYAN}>Buste plus vertical, moins de contraintes genoux et dos.</LearnMiniCard>
        </div>
        <LearnWarning>La cale est un outil p\u00e9dagogique et pr\u00e9ventif, pas une faiblesse.</LearnWarning>
      </LearnAccordion>

      {/* 6 — Partenaire */}
      <LearnAccordion
        title="R\u00f4le du partenaire"
        subtitle="Observer \u00b7 compter \u00b7 conseiller \u00b7 prot\u00e9ger"
        icon={<LearnNumberBadge number={6} accentColor={CYAN} />}
        accentColor={CYAN}
      >
        <div className="flex flex-col gap-[6px]">
          <LearnMiniCard label="Seconde" accentColor={CYAN}>Manipuler les charges avec soin, remettre en ordre, \u00eatre attentif.</LearnMiniCard>
          <LearnMiniCard label="Premi\u00e8re" accentColor={CYAN}>Compter les reps, observer et conseiller la technique.</LearnMiniCard>
          <LearnMiniCard label="Terminale" accentColor={CYAN}>Optimiser la charge en temps r\u00e9el, identifier les manquements, coacher.</LearnMiniCard>
        </div>
        <LearnWarning>Sur le d\u00e9velopp\u00e9 couch\u00e9 et squat lourds : pareur en position, mains sous la barre.</LearnWarning>
        <LearnMethodChips accentColor={CYAN} methods={[
          { label: "Techniques d\u2019entra\u00eenement \u2192", href: "/apprendre/techniques" },
        ]} />
      </LearnAccordion>
    </div>
  );
}
