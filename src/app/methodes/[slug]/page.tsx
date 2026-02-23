import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllMethodes, getMethode } from "@/lib/content/fs";
import { renderMdx } from "@/lib/mdx/render";
import { getServerLang, getServerT } from "@/lib/i18n/server";
import { CategoryBadge } from "@/components/methodes/CategoryBadge";
import { ScoresBlock } from "@/components/methodes/ScoreBar";
import { ParametresTable } from "@/components/methodes/ParametresTable";
import { MethodeTimer } from "@/components/methodes/MethodeTimer";
import { RelatedMethods } from "@/components/methodes/RelatedMethods";
import { RelatedExercices } from "@/components/methodes/RelatedExercices";
import { getExercisesIndex } from "@/lib/exercices/getExercisesIndex";

type MethodePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const methodes = await getAllMethodes();
  return methodes.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({
  params,
}: MethodePageProps): Promise<Metadata> {
  const { slug } = await params;
  const lang = await getServerLang();
  const t = getServerT(lang);
  const result = await getMethode(slug);
  if (!result) return { title: t("methodes.notFound") };
  return { title: result.frontmatter.titre };
}

export default async function MethodePage({ params }: MethodePageProps) {
  const { slug } = await params;
  const lang = await getServerLang();
  const t = getServerT(lang);
  const result = await getMethode(slug);

  if (!result) notFound();

  const { frontmatter: m, content } = result;
  const mdxContent = await renderMdx(content);
  const [allMethodes, allExercices] = await Promise.all([
    getAllMethodes(),
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
      <header className="page-header">
        <Link
          href="/methodes"
          className="eyebrow hover:text-[color:var(--accent)]"
        >
          ← {t("methodes.backLabel")}
        </Link>
        <h1>{m.titre}</h1>
        {m.soustitre ? (
          <p className="text-sm text-[color:var(--muted)]">{m.soustitre}</p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge
            categorie={m.categorie}
            label={categoryLabels[m.categorie] ?? m.categorie}
          />
          <span className="pill">
            {t("methodes.niveau")} : {t(`methodes.niveaux.${m.niveau_minimum}`)}
          </span>
        </div>
      </header>

      <div className="card">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[color:var(--muted)]">
          {t("methodes.scores.endurance")} / {t("methodes.scores.hypertrophie")} /{" "}
          {t("methodes.scores.force")} / {t("methodes.scores.puissance")}
        </h2>
        <ScoresBlock scores={m.scores} labels={scoreLabels} />
      </div>

      <div className="card">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[color:var(--muted)]">
          {t("methodes.parametres.label")}
        </h2>
        <ParametresTable parametres={m.parametres} labels={parametresLabels} />
      </div>

      {m.timer ? <MethodeTimer labels={timerLabels} /> : null}

      <div className="flex flex-col gap-4">{mdxContent}</div>

      {m.methodes_complementaires.length > 0 ? (
        <RelatedMethods
          slugs={m.methodes_complementaires}
          allMethodes={allMethodes}
          heading={t("methodes.related")}
          categoryLabels={categoryLabels}
        />
      ) : null}

      {m.exercices_compatibles.length > 0 ? (
        <RelatedExercices
          slugs={m.exercices_compatibles}
          allExercices={allExercices}
          heading={t("methodes.exercicesCompatibles")}
        />
      ) : null}
    </section>
  );
}
