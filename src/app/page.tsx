import Image from "next/image";
import Link from "next/link";
import { HomeFlyer } from "@/components/HomeFlyer";
import { getServerLang, getServerT } from "@/lib/i18n/server";

export default async function HomePage() {
  const lang = await getServerLang();
  const t = getServerT(lang);

  const pillBase =
    "w-full rounded-2xl px-5 py-4 text-left font-semibold tracking-wide " +
    "border border-white/15 shadow-[0_12px_30px_rgba(0,0,0,0.35)] " +
    "backdrop-blur-md ring-1 ring-white/10 " +
    "transition hover:scale-[1.01] active:scale-[0.99] " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30";
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

  const imageButtonBase =
    "block overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-sm transition-transform " +
    "hover:scale-[1.01] active:scale-[0.99]";

  return (
    <section className="page">
      <HomeFlyer />
      <header className="stack-md text-center">
        <h1 className="text-4xl font-semibold text-[color:var(--ink)]">
          {t("pages.home.title")}
        </h1>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[var(--shadow)] backdrop-blur-xl">
          <h2 className="text-base font-semibold text-[color:var(--ink)]">
            {t("pages.home.themesHeading")}
          </h2>
          <div className="flex flex-col gap-3">
            <Link
              href="/apprendre/parametres#endurance-de-force"
              className={imageButtonBase}
            >
              <Image
                src="/images/menus/bouton-endurance-de-force.webp"
                alt={t("pages.home.theme1Alt")}
                width={1536}
                height={384}
                sizes="(max-width: 768px) 100vw, 720px"
                className="h-auto w-full"
                priority
              />
            </Link>
            <Link
              href="/apprendre/parametres#gain-de-volume-hypertrophie"
              className={imageButtonBase}
            >
              <Image
                src="/images/menus/bouton-gain-de-volume.webp"
                alt={t("pages.home.theme2Alt")}
                width={1536}
                height={384}
                sizes="(max-width: 768px) 100vw, 720px"
                className="h-auto w-full"
              />
            </Link>
            <Link
              href="/apprendre/parametres#gain-de-puissance"
              className={imageButtonBase}
            >
              <Image
                src="/images/menus/bouton-power-gain.webp"
                alt={t("pages.home.theme3Alt")}
                width={1536}
                height={384}
                sizes="(max-width: 768px) 100vw, 720px"
                className="h-auto w-full"
              />
            </Link>
          </div>

          <div className="mt-2 flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-[color:var(--ink)]">
              {t("pages.home.projectsHeading")}
            </h3>
            <Link
              href="/bac#projets"
              className={`${pillBase} ${pillGreen}`}
            >
              {t("pages.home.project1")}
            </Link>
            <Link
              href="/bac#projets"
              className={`${pillBase} ${pillGreen}`}
            >
              {t("pages.home.project2")}
            </Link>
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[var(--shadow)] backdrop-blur-xl">
          <h2 className="text-base font-semibold text-[color:var(--ink)]">
            {t("pages.home.knowledgeHeading")}
          </h2>
          <div className="flex flex-col gap-3">
            <Link
              href="/apprendre/connaissances#les-muscles-et-leur-fonctionnement"
              className={`${pillBase} ${pillGray}`}
            >
              {t("pages.home.knowledge1")}
            </Link>
            <Link
              href="/apprendre/techniques#methodes-dentrainement"
              className={`${pillBase} ${pillGray}`}
            >
              {t("pages.home.knowledge2")}
            </Link>
            <Link
              href="/apprendre/techniques#rm-rir-rpe"
              className={`${pillBase} ${pillGray}`}
            >
              {t("pages.home.knowledge3")}
            </Link>
          </div>
          <Link
            href="/apprendre/techniques#principes-securitaires"
            className={`${pillBase} ${pillGold}`}
          >
            {t("pages.home.safetyPrinciples")}
          </Link>
        </section>

        <section className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[var(--shadow)] backdrop-blur-xl">
          <Link
            href="/bac#competences"
            className={`${pillBase} ${pillRose}`}
          >
            {t("pages.home.skills")}
          </Link>

          <h2 className="text-base font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
            {t("pages.home.evaluation")}
          </h2>
          <div className="flex flex-col gap-3">
            <Link
              href="/bac#evaluation-2nde"
              className={`${pillBase} ${pillGold}`}
            >
              {t("pages.home.eval2nde")}
            </Link>
            <Link
              href="/bac#evaluation-1ere"
              className={`${pillBase} ${pillGold}`}
            >
              {t("pages.home.eval1ere")}
            </Link>
            <Link
              href="/bac#evaluation-terminale"
              className={`${pillBase} ${pillGold}`}
            >
              {t("pages.home.evalTerminale")}
            </Link>
          </div>
        </section>
      </div>
    </section>
  );
}
