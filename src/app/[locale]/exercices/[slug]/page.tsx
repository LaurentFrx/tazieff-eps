import { Suspense } from "react";
import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { getExercise, getMethodesForExercice } from "@/lib/content/fs";
import { getImportedExercisesIndex } from "@/lib/exercices/getImportedExercisesIndex";
import { getExercisesIndex } from "@/lib/exercices/getExercisesIndex";
import { applyExercisePatch } from "@/lib/live/patch";
import { fetchExerciseOverride, fetchLiveExercise } from "@/lib/live/queries";
import { ExerciseLiveDetail } from "@/app/[locale]/exercices/[slug]/ExerciseLiveDetail";
// RSC: locale from [locale] route segment — no cookie read needed
import { getServerLang, getServerT } from "@/lib/i18n/server";
import type { Lang } from "@/lib/i18n/messages";
import { ALL_LOCALES } from "@/lib/i18n/locale-params";

import { MethodeCard } from "@/components/methodes/MethodeCard";

type ExercicePageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

async function revalidateExercises(slug: string) {
  "use server";
  revalidatePath("/exercices");
  revalidatePath(`/exercices/${slug}`, "page");
}

async function getImportedExercise(slug: string) {
  const importedItems = await getImportedExercisesIndex();
  return importedItems.find((item) => item.slug === slug) ?? null;
}

type SectionLabels = {
  resume: string;
  execution: string;
  respiration: string;
  conseils: string;
  erreurs: string;
  securite: string;
};

function convertImportedToContent(
  imported: Awaited<ReturnType<typeof getImportedExercise>>,
  labels: SectionLabels,
): string {
  if (!imported) return "";

  const sections: string[] = [];

  if (imported.summary) {
    sections.push(`## ${labels.resume}\n\n${imported.summary}`);
  }

  if (imported.executionSteps?.length) {
    sections.push(
      `## ${labels.execution}\n\n${imported.executionSteps.map((step) => `- ${step}`).join("\n")}`
    );
  }

  if (imported.breathing) {
    sections.push(`## ${labels.respiration}\n\n${imported.breathing}`);
  }

  if (imported.tips?.length) {
    sections.push(
      `## ${labels.conseils}\n\n${imported.tips.map((tip) => `- ${tip}`).join("\n")}`
    );
  }

  if (imported.commonMistakes?.length) {
    sections.push(
      `## ${labels.erreurs}\n\n${imported.commonMistakes.map((mistake) => `- ${mistake}`).join("\n")}`
    );
  }

  if (imported.safety?.length) {
    sections.push(
      `## ${labels.securite}\n\n${imported.safety.map((item) => `- ${item}`).join("\n")}`
    );
  }

  return sections.join("\n\n");
}

export async function generateStaticParams() {
  const exercises = await getExercisesIndex("fr");
  return ALL_LOCALES.flatMap((locale) =>
    exercises.map((exercise) => ({ locale, slug: exercise.slug })),
  );
}

export async function generateMetadata({
  params,
}: ExercicePageProps): Promise<Metadata> {
  const { locale: localeParam, slug } = await params;
  const locale = await getServerLang(localeParam as Lang);
  const result = await getExercise(slug, locale);
  const liveExercise = result ? null : await fetchLiveExercise(slug, locale);
  const importedExercise = result || liveExercise ? null : await getImportedExercise(slug);

  const t = getServerT(locale);

  if (!result && !liveExercise && !importedExercise) {
    return { title: t("exerciseDetail.notFound") };
  }

  if (importedExercise) {
    const title = importedExercise.title;
    return {
      title,
      description: `${title} — ${t("header.exercicesSubtitle")}`,
      openGraph: {
        title,
        ...(importedExercise.media ? { images: [importedExercise.media] } : {}),
      },
    };
  }

  const base = result
    ? { frontmatter: result.frontmatter, content: result.content }
    : liveExercise!.data_json;
  const override = await fetchExerciseOverride(slug, locale);
  const merged = applyExercisePatch(base, override?.patch_json ?? null);
  const title = merged.frontmatter.title;
  const muscles = merged.frontmatter.muscles?.join(", ") ?? "";
  const description = muscles ? `${title} — ${muscles}` : title;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(merged.frontmatter.media ? { images: [merged.frontmatter.media] } : {}),
    },
  };
}

export default async function ExercicePage({ params }: ExercicePageProps) {
  const { locale: localeParam, slug } = await params;
  const locale = await getServerLang(localeParam as Lang);
  const t = getServerT(locale);
  const result = await getExercise(slug, locale);
  const liveExercise = result ? null : await fetchLiveExercise(slug, locale);
  const importedExercise = result || liveExercise ? null : await getImportedExercise(slug);

  if (!result && !liveExercise && !importedExercise) {
    notFound();
  }

  // Determine source and prepare data for ExerciseLiveDetail
  const source = result ? "mdx" : liveExercise ? "live" : "imported";
  const baseFrontmatter = result
    ? result.frontmatter
    : liveExercise
      ? liveExercise.data_json.frontmatter
      : importedExercise!;
  const sectionLabels = {
    resume: t("exerciseDetail.sections.resume"),
    execution: t("exerciseDetail.sections.execution"),
    respiration: t("exerciseDetail.sections.respiration"),
    conseils: t("exerciseDetail.sections.conseils"),
    erreurs: t("exerciseDetail.sections.erreurs"),
    securite: t("exerciseDetail.sections.securite"),
  };
  const baseContent = result
    ? result.content
    : liveExercise
      ? liveExercise.data_json.content
      : convertImportedToContent(importedExercise, sectionLabels);

  const [override, compatibleMethodes] = await Promise.all([
    fetchExerciseOverride(slug, locale),
    getMethodesForExercice(slug, locale),
  ]);
  const initialPatch = override?.patch_json ?? null;

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

  const exerciseTitle = (baseFrontmatter as { title?: string }).title ?? slug;

  return (
    <section className="page">
      <Suspense>
        <ExerciseLiveDetail
          key={`${slug}-${locale}`}
          slug={slug}
          locale={locale}
          source={source}
          baseFrontmatter={baseFrontmatter}
          baseContent={baseContent}
          initialPatch={initialPatch}
          onRevalidate={revalidateExercises}
        />
      </Suspense>

      {compatibleMethodes.length > 0 ? (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            <span className="border-b-2 border-orange-400 pb-1">{t("methodes.compatiblesHeading")}</span>
          </h2>
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1">
            {compatibleMethodes.map((methode) => (
              <div key={methode.slug} className="snap-start shrink-0 w-[280px] md:w-auto md:shrink md:flex-1 md:min-w-[240px]">
                <MethodeCard
                  slug={methode.slug}
                  titre={methode.titre}
                  categorie={methode.categorie}
                  categoryLabel={categoryLabels[methode.categorie] ?? methode.categorie}
                  scores={methode.scores}
                  scoreLabels={scoreLabels}
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
