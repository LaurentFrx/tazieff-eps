import Link from "next/link";
import { HomeFlyer } from "@/components/HomeFlyer";

export default function HomePage() {
  const pillBase =
    "w-full rounded-2xl px-5 py-4 text-left font-semibold tracking-wide " +
    "border border-white/15 shadow-[0_12px_30px_rgba(0,0,0,0.35)] " +
    "backdrop-blur-md ring-1 ring-white/10 " +
    "transition hover:scale-[1.01] active:scale-[0.99] " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30";
  const pillPurple =
    "bg-gradient-to-r from-violet-600/70 to-fuchsia-500/40 text-white " +
    "hover:from-violet-500/80 hover:to-fuchsia-400/50";
  const pillGreen =
    "bg-gradient-to-r from-emerald-600/70 to-lime-500/35 text-white " +
    "hover:from-emerald-500/80 hover:to-lime-400/45";
  const pillGray =
    "bg-gradient-to-r from-slate-700/80 to-slate-500/35 text-white " +
    "hover:from-slate-600/90 hover:to-slate-400/45";
  const pillGold =
    "bg-gradient-to-r from-amber-400/85 to-yellow-300/55 text-slate-950 " +
    "hover:from-amber-300/95 hover:to-yellow-200/70";
  const pillRose =
    "bg-gradient-to-r from-rose-500/75 to-pink-500/40 text-white " +
    "hover:from-rose-400/85 hover:to-pink-400/55";

  return (
    <section className="page">
      <HomeFlyer />
      <header className="stack-md text-center">
        <h1 className="text-4xl font-semibold text-[color:var(--ink)]">
          LA MUSCULATION EN EPS
        </h1>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[var(--shadow)] backdrop-blur-xl">
          <h2 className="text-base font-semibold text-[color:var(--ink)]">
            Les 3 thèmes au choix:
          </h2>
          <div className="flex flex-col gap-3">
            <Link
              href="/apprendre/parametres#endurance-de-force"
              className={`${pillBase} ${pillPurple}`}
            >
              ENDURANCE DE FORCE (Tonification)
            </Link>
            <Link
              href="/apprendre/parametres#gain-de-volume-hypertrophie"
              className={`${pillBase} ${pillPurple}`}
            >
              GAIN DE VOLUME
            </Link>
            <Link
              href="/apprendre/parametres#gain-de-puissance"
              className={`${pillBase} ${pillPurple}`}
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
              className={`${pillBase} ${pillGreen}`}
            >
              DÉTENTE VERTICALE
            </Link>
            <Link
              href="/bac#projets"
              className={`${pillBase} ${pillGreen}`}
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
              className={`${pillBase} ${pillGray}`}
            >
              LES MUSCLES ET LEUR FONCTIONNEMENT
            </Link>
            <Link
              href="/apprendre/techniques#methodes-dentrainement"
              className={`${pillBase} ${pillGray}`}
            >
              MÉTHODES D’ENTRAÎNEMENT
            </Link>
            <Link
              href="/apprendre/techniques#rm-rir-rpe"
              className={`${pillBase} ${pillGray}`}
            >
              RM/RIR/RPE
            </Link>
          </div>
          <Link
            href="/apprendre/techniques#principes-securitaires"
            className={`${pillBase} ${pillGold}`}
          >
            PRINCIPES SÉCURITAIRES
          </Link>
        </section>

        <section className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[var(--shadow)] backdrop-blur-xl">
          <Link
            href="/bac#competences"
            className={`${pillBase} ${pillRose}`}
          >
            Compétences attendues au lycée (démarche spiralaire).
          </Link>

          <h2 className="text-base font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
            Evaluation
          </h2>
          <div className="flex flex-col gap-3">
            <Link
              href="/bac#evaluation-2nde"
              className={`${pillBase} ${pillGold}`}
            >
              Evaluation en 2nde
            </Link>
            <Link
              href="/bac#evaluation-1ere"
              className={`${pillBase} ${pillGold}`}
            >
              Evaluation en 1ère
            </Link>
            <Link
              href="/bac#evaluation-terminale"
              className={`${pillBase} ${pillGold}`}
            >
              Evaluation en Terminale
            </Link>
          </div>
        </section>
      </div>
    </section>
  );
}
