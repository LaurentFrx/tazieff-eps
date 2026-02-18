import type { Metadata } from "next";
import { revalidatePath, revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getExercise } from "@/lib/content/fs";
import { getImportedExercisesIndex } from "@/lib/exercices/getImportedExercisesIndex";
import { getExercisesIndex } from "@/lib/exercices/getExercisesIndex";
import { applyExercisePatch } from "@/lib/live/patch";
import { fetchExerciseOverride, fetchLiveExercise } from "@/lib/live/queries";
import type { Lang } from "@/lib/i18n/messages";
import { ExerciseLiveDetail } from "@/app/exercices/[slug]/ExerciseLiveDetail";

type ExercicePageProps = {
  params: Promise<{ slug: string }>;
};

const LANG_COOKIE = "eps_lang";

function getInitialLang(value?: string): Lang {
  if (value === "en" || value === "es") return value;
  return "fr";
}

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

function convertImportedToContent(imported: Awaited<ReturnType<typeof getImportedExercise>>): string {
  if (!imported) return "";

  const sections: string[] = [];

  if (imported.summary) {
    sections.push(`## Résumé\n\n${imported.summary}`);
  }

  if (imported.executionSteps?.length) {
    sections.push(
      `## Exécution\n\n${imported.executionSteps.map((step) => `- ${step}`).join("\n")}`
    );
  }

  if (imported.breathing) {
    sections.push(`## Respiration\n\n${imported.breathing}`);
  }

  if (imported.tips?.length) {
    sections.push(
      `## Conseils\n\n${imported.tips.map((tip) => `- ${tip}`).join("\n")}`
    );
  }

  if (imported.commonMistakes?.length) {
    sections.push(
      `## Erreurs fréquentes\n\n${imported.commonMistakes.map((mistake) => `- ${mistake}`).join("\n")}`
    );
  }

  if (imported.safety?.length) {
    sections.push(
      `## Sécurité\n\n${imported.safety.map((item) => `- ${item}`).join("\n")}`
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
  const cookieStore = await cookies();
  const locale = getInitialLang(cookieStore.get(LANG_COOKIE)?.value);
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
  const cookieStore = await cookies();
  const locale = getInitialLang(cookieStore.get(LANG_COOKIE)?.value);
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
  const baseContent = result
    ? result.content
    : liveExercise
      ? liveExercise.data_json.content
      : convertImportedToContent(importedExercise);

  const override = await fetchExerciseOverride(slug, locale);
  const initialPatch = override?.patch_json ?? null;

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
    </section>
  );
}
