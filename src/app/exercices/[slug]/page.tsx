import type { Metadata } from "next";
import { revalidatePath, revalidateTag } from "next/cache";
import { notFound } from "next/navigation";
import { getExercise, getMethodesForExercice } from "@/lib/content/fs";
import { getImportedExercisesIndex } from "@/lib/exercices/getImportedExercisesIndex";
import { getExercisesIndex } from "@/lib/exercices/getExercisesIndex";
import { applyExercisePatch } from "@/lib/live/patch";
import { fetchExerciseOverride, fetchLiveExercise } from "@/lib/live/queries";
import { ExerciseLiveDetail } from "@/app/exercices/[slug]/ExerciseLiveDetail";
import { getServerLang, getServerT } from "@/lib/i18n/server";
import { CategoryBadge } from "@/components/methodes/CategoryBadge";
import { ScoresBlock } from "@/components/methodes/ScoreBar";

type ExercicePageProps = {
  params: Promise<{ slug: string }>;
};

async function revalidateExercises(slug: string) {
  "use server";
  revalidateTag("exercises", "max");
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
  return exercises.map((exercise) => ({
    slug: exercise.slug,
  }));
}

export async function generateMetadata({
  params,
}: ExercicePageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getServerLang();
  const result = await getExercise(slug, locale);
  const liveExercise = result ? null : await fetchLiveExercise(slug, locale);
  const importedExercise = result || liveExercise ? null : await getImportedExercise(slug);

  if (!result && !liveExercise && !importedExercise) {
    return { title: "Exercice introuvable" };
  }

  if (importedExercise) {
    return { title: importedExercise.title };
  }

  const base = result
    ? { frontmatter: result.frontmatter, content: result.content }
    : liveExercise!.data_json;
  const override = await fetchExerciseOverride(slug, locale);
  const merged = applyExercisePatch(base, override?.patch_json ?? null);

  return { title: merged.frontmatter.title };
}

export default async function ExercicePage({ params }: ExercicePageProps) {
  const { slug } = await params;
  const locale = await getServerLang();
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
    getMethodesForExercice(slug),
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

  return (
    <section className="page">
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

      {compatibleMethodes.length > 0 ? (
        <div className="card">
          <h2 className="mb-4 text-base font-semibold text-[color:var(--ink)]">
            {t("methodes.compatiblesHeading")}
          </h2>
          <ul className="flex flex-col gap-3">
            {compatibleMethodes.map((methode) => (
              <li key={methode.slug}>
                <a
                  href={`/methodes/${methode.slug}`}
                  className="flex flex-col gap-2 rounded-lg border border-[color:var(--border)] p-3 transition-colors hover:border-[color:var(--accent)]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[color:var(--ink)]">
                      {methode.titre}
                    </p>
                    <CategoryBadge
                      categorie={methode.categorie}
                      label={categoryLabels[methode.categorie] ?? methode.categorie}
                    />
                  </div>
                  <ScoresBlock scores={methode.scores} labels={scoreLabels} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
