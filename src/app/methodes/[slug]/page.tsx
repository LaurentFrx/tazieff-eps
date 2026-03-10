import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllMethodes, getAllMethods, getMethode, getMethodBySlug } from "@/lib/content/fs";
import { renderMdx } from "@/lib/mdx/render";
import { getServerLang, getServerT } from "@/lib/i18n/server";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { DetailHeader } from "@/components/DetailHeader";
import { CategoryBadge } from "@/components/methodes/CategoryBadge";
import { ScoresBlock } from "@/components/methodes/ScoreBar";
import { ParametresTable } from "@/components/methodes/ParametresTable";
import { MethodeTimer } from "@/components/methodes/MethodeTimer";
import { RelatedMethods } from "@/components/methodes/RelatedMethods";
import { RelatedExercices } from "@/components/methodes/RelatedExercices";
import { getExercisesIndex } from "@/lib/exercices/getExercisesIndex";
import type { Methode } from "@/lib/content/schema";
import type { Lang } from "@/lib/i18n/messages";

type MethodePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const [legacy, v2] = await Promise.all([getAllMethodes(), getAllMethods()]);
  const slugs = new Set([...legacy.map((m) => m.slug), ...v2.map((m) => m.slug)]);
  return Array.from(slugs).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: MethodePageProps): Promise<Metadata> {
  const { slug } = await params;
  const lang = await getServerLang();
  const t = getServerT(lang);

  const v2 = await getMethodBySlug(slug, lang);
  if (v2) {
    const { title, description } = v2.frontmatter;
    return {
      title,
      description,
      openGraph: { title, description },
    };
  }

  const result = await getMethode(slug, lang);
  if (!result) return { title: t("methodes.notFound") };
  const { titre, description, categorie } = result.frontmatter;
  const desc = description || `${titre} — ${categorie}`;
  return {
    title: titre,
    description: desc,
    openGraph: { title: titre, description: desc },
  };
}

/* ── V2 method detail (content/methods/) ─────────────────────────────────── */

async function MethodeV2Detail({
  m,
  content,
  t,
  lang,
}: {
  m: Methode;
  content: string;
  t: (key: string) => string;
  lang: Lang;
}) {
  const mdxContent = await renderMdx(content);
  const allExercices = await getExercisesIndex(lang);

  const scoreLabels = {
    endurance: t("methodes.scores.endurance"),
    hypertrophie: t("methodes.scores.hypertrophie"),
    force: t("methodes.scores.force"),
    puissance: t("methodes.scores.puissance"),
  };

  const parametresForTable = {
    series: m.parametres.series,
    repetitions: m.parametres.repetitions,
    intensite: m.parametres.intensite,
    recuperation: m.parametres.recuperation,
    duree: m.parametres.tempo,
  };

  const parametresLabels = {
    series: t("methodes.parametres.series"),
    repetitions: t("methodes.parametres.repetitions"),
    intensite: t("methodes.parametres.intensite"),
    recuperation: t("methodes.parametres.recuperation"),
    duree: t("methodes.parametres.tempo"),
  };

  const objectifLabel = t(`methodes.objectifs.${m.objectifPrincipal}`);
  const niveauLabel = t(`difficulty.${m.niveau}`);
  const compatibleSlugs = m.exercicesCompatibles ?? [];

  return (
    <section className="page">
      <Breadcrumbs
        items={[
          { label: t("nav.home.label"), href: "/" },
          { label: t("breadcrumbs.methodes"), href: "/methodes" },
          { label: m.title },
        ]}
      />
      <DetailHeader
        title={m.title}
        gradient="from-blue-600 to-cyan-500"
        backHref="/methodes"
        backLabel={t("methodes.backLabel")}
        badges={
          <>
            <span className="inline-flex items-center rounded-full bg-white/20 text-white px-3 py-1 text-xs font-medium">
              {objectifLabel}
            </span>
            <span className="inline-flex items-center rounded-full bg-white/20 text-white px-3 py-1 text-xs font-medium">
              {niveauLabel}
            </span>
          </>
        }
      >
        <p className="text-sm text-white/80 mt-1">{m.description}</p>
      </DetailHeader>

      <div className="rounded-2xl bg-white/80 dark:bg-zinc-900/60 shadow-sm p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {t("methodes.scores.endurance")} / {t("methodes.scores.hypertrophie")} /{" "}
          {t("methodes.scores.force")} / {t("methodes.scores.puissance")}
        </h2>
        <ScoresBlock scores={m.scores} labels={scoreLabels} />
      </div>

      <div className="rounded-2xl bg-white/80 dark:bg-zinc-900/60 shadow-sm p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {t("methodes.parametres.label")}
        </h2>
        <ParametresTable parametres={parametresForTable} labels={parametresLabels} />
      </div>

      <div className="rounded-2xl bg-white/80 dark:bg-zinc-900/60 shadow-sm p-5 md:p-6 flex flex-col gap-5">
        {mdxContent}
      </div>

      {compatibleSlugs.length > 0 ? (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            <span className="border-b-2 border-blue-400 pb-1">{t("methodes.exercicesCompatibles")}</span>
          </h2>
          <RelatedExercices
            slugs={compatibleSlugs}
            allExercices={allExercices}
            heading=""
          />
        </div>
      ) : null}
    </section>
  );
}

/* ── Main page component ─────────────────────────────────────────────────── */

export default async function MethodePage({ params }: MethodePageProps) {
  const { slug } = await params;
  const lang = await getServerLang();
  const t = getServerT(lang);

  /* Try V2 system first (content/methods/) */
  const v2Result = await getMethodBySlug(slug, lang);
  if (v2Result) {
    return (
      <MethodeV2Detail
        m={v2Result.frontmatter}
        content={v2Result.content}
        t={t}
        lang={lang}
      />
    );
  }

  /* Fall back to legacy system (content/methodes/) */
  const result = await getMethode(slug, lang);
  if (!result) notFound();

  const { frontmatter: m, content } = result;
  const mdxContent = await renderMdx(content);
  const [allMethodes, allExercices] = await Promise.all([
    getAllMethodes(lang),
    getExercisesIndex(lang),
  ]);

  const categoryLabels: Record<string, string> = {
    "endurance-de-force": t("methodes.categories.endurance-de-force"),
    "gain-de-volume": t("methodes.categories.gain-de-volume"),
    "gain-de-puissance": t("methodes.categories.gain-de-puissance"),
  };

  const scoreLabels = {
    endurance: t("methodes.scores.endurance"),
    hypertrophie: t("methodes.scores.hypertrophie"),
    force: t("methodes.scores.force"),
    puissance: t("methodes.scores.puissance"),
  };

  const parametresLabels = {
    series: t("methodes.parametres.series"),
    repetitions: t("methodes.parametres.repetitions"),
    intensite: t("methodes.parametres.intensite"),
    recuperation: t("methodes.parametres.recuperation"),
    duree: t("methodes.parametres.duree"),
  };

  const timerLabels = {
    heading: t("methodes.timer.heading"),
    start: t("methodes.timer.start"),
    pause: t("methodes.timer.pause"),
    reset: t("methodes.timer.reset"),
    minutes: t("methodes.timer.minutes"),
    setDuration: t("methodes.timer.setDuration"),
  };

  return (
    <section className="page">
      <Breadcrumbs
        items={[
          { label: t("nav.home.label"), href: "/" },
          { label: t("breadcrumbs.methodes"), href: "/methodes" },
          { label: m.titre },
        ]}
      />
      <DetailHeader
        title={m.titre}
        gradient="from-blue-600 to-cyan-500"
        backHref="/methodes"
        backLabel={t("methodes.backLabel")}
        badges={
          <>
            <CategoryBadge
              categorie={m.categorie}
              label={categoryLabels[m.categorie] ?? m.categorie}
            />
            <span className="inline-flex items-center rounded-full bg-white/20 text-white px-3 py-1 text-xs font-medium">
              {t("methodes.niveau")} : {t(`methodes.niveaux.${m.niveau_minimum}`)}
            </span>
          </>
        }
      >
        {m.soustitre ? (
          <p className="text-sm text-white/80 mt-1">{m.soustitre}</p>
        ) : null}
      </DetailHeader>

      <div className="rounded-2xl bg-white/80 dark:bg-zinc-900/60 shadow-sm p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {t("methodes.scores.endurance")} / {t("methodes.scores.hypertrophie")} /{" "}
          {t("methodes.scores.force")} / {t("methodes.scores.puissance")}
        </h2>
        <ScoresBlock scores={m.scores} labels={scoreLabels} />
      </div>

      <div className="rounded-2xl bg-white/80 dark:bg-zinc-900/60 shadow-sm p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {t("methodes.parametres.label")}
        </h2>
        <ParametresTable parametres={m.parametres} labels={parametresLabels} />
      </div>

      {m.timer ? (
        <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/30 shadow-sm p-5">
          <MethodeTimer labels={timerLabels} />
          <Link
            href="/outils/timer"
            className="mt-4 flex items-center justify-center py-3 text-sm font-semibold text-blue-600 dark:text-blue-400 rounded-xl bg-white/60 dark:bg-zinc-900/40 hover:bg-white dark:hover:bg-zinc-800 transition-colors"
          >
            {t("methodes.timer.fullTimerLink")}
          </Link>
        </div>
      ) : null}

      <div className="rounded-2xl bg-white/80 dark:bg-zinc-900/60 shadow-sm p-5 md:p-6 flex flex-col gap-5">
        {mdxContent}
      </div>

      {m.methodes_complementaires.length > 0 ? (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            <span className="border-b-2 border-blue-400 pb-1">{t("methodes.related")}</span>
          </h2>
          <RelatedMethods
            slugs={m.methodes_complementaires}
            allMethodes={allMethodes}
            heading=""
            categoryLabels={categoryLabels}
          />
        </div>
      ) : null}

      {m.exercices_compatibles.length > 0 ? (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            <span className="border-b-2 border-blue-400 pb-1">{t("methodes.exercicesCompatibles")}</span>
          </h2>
          <RelatedExercices
            slugs={m.exercices_compatibles}
            allExercices={allExercices}
            heading=""
          />
        </div>
      ) : null}
    </section>
  );
}
