import Link from "next/link";
import { HomeFlyer } from "@/components/HomeFlyer";

export default function HomePage() {
  const buttonBase =
    "block w-full rounded-2xl px-4 py-3 text-sm font-semibold text-[color:var(--ink)] border border-white/10 backdrop-blur-md transition hover:-translate-y-0.5 hover:shadow-[var(--shadow)]";

  return (
    <section className="page">
      <HomeFlyer />
      <header className="stack-md text-center">
        <h1 className="text-4xl font-semibold text-[color:var(--ink)]">
          LA MUSCULATION EN EPS
        </h1>
        <p className="text-sm text-[color:var(--muted)]">
          Cliquer sur les rubriques pour accéder aux contenus
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[var(--shadow)] backdrop-blur-xl">
          <h2 className="text-base font-semibold text-[color:var(--ink)]">
            Les 3 thèmes au choix:
          </h2>
          <div className="flex flex-col gap-3">
            <Link
              href="/apprendre/parametres#endurance-de-force"
              className={`${buttonBase} bg-violet-400/20 hover:bg-violet-300/30`}
            >
              ENDURANCE DE FORCE (Tonification)
            </Link>
            <Link
              href="/apprendre/parametres#gain-de-volume-hypertrophie"
              className={`${buttonBase} bg-violet-400/20 hover:bg-violet-300/30`}
            >
              GAIN DE VOLUME
            </Link>
            <Link
              href="/apprendre/parametres#gain-de-puissance"
              className={`${buttonBase} bg-violet-400/20 hover:bg-violet-300/30`}
            >
              GAIN DE PUISSANCE
            </Link>
          </div>

          <div className="mt-2 flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-[color:var(--ink)]">
              Les projets spécifiques:
            </h3>
            <Link
              href="/bac#projets"
              className={`${buttonBase} bg-emerald-400/20 hover:bg-emerald-300/30`}
            >
              DÉTENTE VERTICALE
            </Link>
            <Link
              href="/bac#projets"
              className={`${buttonBase} bg-emerald-400/20 hover:bg-emerald-300/30`}
            >
              VITESSE et AGILITÉ en SPORTS COLLECTIFS
            </Link>
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[var(--shadow)] backdrop-blur-xl">
          <h2 className="text-base font-semibold text-[color:var(--ink)]">
            Connaissances pour s’entraîner
          </h2>
          <div className="flex flex-col gap-3">
            <Link
              href="/apprendre/connaissances#les-muscles-et-leur-fonctionnement"
              className={`${buttonBase} bg-white/20 hover:bg-white/30`}
            >
              LES MUSCLES ET LEUR FONCTIONNEMENT
            </Link>
            <Link
              href="/apprendre/techniques#methodes-dentrainement"
              className={`${buttonBase} bg-white/20 hover:bg-white/30`}
            >
              MÉTHODES D’ENTRAÎNEMENT
            </Link>
            <Link
              href="/apprendre/techniques#rm-rir-rpe"
              className={`${buttonBase} bg-white/20 hover:bg-white/30`}
            >
              RM/RIR/RPE
            </Link>
          </div>
          <Link
            href="/apprendre/techniques#principes-securitaires"
            className={`${buttonBase} bg-amber-300/40 hover:bg-amber-300/55`}
          >
            PRINCIPES SÉCURITAIRES
          </Link>
        </section>

        <section className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[var(--shadow)] backdrop-blur-xl">
          <Link
            href="/bac#competences"
            className="rounded-2xl border border-rose-200/40 bg-rose-300/30 px-4 py-3 text-sm font-semibold text-[color:var(--ink)] shadow-[var(--shadow)] backdrop-blur-md transition hover:-translate-y-0.5"
          >
            Compétences attendues au lycée (démarche spiralaire).
          </Link>

          <h2 className="text-base font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
            Evaluation
          </h2>
          <div className="flex flex-col gap-3">
            <Link
              href="/bac#evaluation-2nde"
              className={`${buttonBase} bg-amber-300/40 hover:bg-amber-300/55`}
            >
              Evaluation en 2nde
            </Link>
            <Link
              href="/bac#evaluation-1ere"
              className={`${buttonBase} bg-amber-300/40 hover:bg-amber-300/55`}
            >
              Evaluation en 1ère
            </Link>
            <Link
              href="/bac#evaluation-terminale"
              className={`${buttonBase} bg-amber-300/40 hover:bg-amber-300/55`}
            >
              Evaluation en Terminale
            </Link>
          </div>
        </section>
      </div>
    </section>
  );
}
