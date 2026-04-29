export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { getExercise, getMethodesForExercice } from "@/lib/content/fs";
import { getImportedExercisesIndex } from "@/lib/exercices/getImportedExercisesIndex";
import { getExercisesIndex } from "@/lib/exercices/getExercisesIndex";
import { applyExercisePatch } from "@/lib/live/patch";
import { fetchExerciseOverride, fetchLiveExercise } from "@/lib/live/queries";
import { fetchStudentAnnotations } from "@/lib/live/student-annotations";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ExerciseLiveDetail } from "@/app/[locale]/exercices/[slug]/ExerciseLiveDetail";
// RSC: useI18n() unavailable — read lang from cookie via getServerLang()
import { getServerLang, getServerT } from "@/lib/i18n/server";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import { MethodeCard } from "@/components/methodes/MethodeCard";
import { SessionExercises } from "@/app/[locale]/exercices/[slug]/SessionExercises";
import { ComplementaryExercises } from "@/components/exercices/ComplementaryExercises";
import { LastWorkedBadge } from "@/components/exercices/LastWorkedBadge";
import { getComplementaryExercises } from "@/lib/exercices/muscle-pairs";

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
  const locales = ["fr", "en", "es"] as const;
  const params: { locale: string; slug: string }[] = [];
  for (const locale of locales) {
    const exercises = await getExercisesIndex(locale);
    for (const exercise of exercises) {
      params.push({ locale, slug: exercise.slug });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: ExercicePageProps): Promise<Metadata> {
  const { locale: localeParam, slug } = await params;
  const locale = getServerLang(localeParam);
  const result = await getExercise(slug, locale);
  const liveExercise = result ? null : await fetchLiveExercise(slug, locale);
  const importedExercise = result || liveExercise ? null : await getImportedExercise(slug);

  const t = getServerT(locale);

  if (!result && !liveExercise && !importedExercise) {
    return { title: t("exerciseDetail.notFound") };
  }

  if (importedExercise) {
    const title = importedExercise.title;
    const desc = `${title} — ${t("header.exercicesSubtitle")}`;
    const ogImage = importedExercise.media || `/images/exos/${slug}.webp`;
    return {
      title,
      description: desc,
      openGraph: {
        title: `${title} — Tazieff EPS`,
        description: desc,
        type: "article",
        images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      },
      twitter: { card: "summary_large_image", title, description: desc, images: [ogImage] },
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
  const ogImage = merged.frontmatter.media || `/images/exos/${slug}.webp`;

  return {
    title,
    description,
    openGraph: {
      title: `${title} — Tazieff EPS`,
      description,
      type: "article",
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [ogImage] },
  };
}

export default async function ExercicePage({ params }: ExercicePageProps) {
  const { locale: localeParam, slug } = await params;
  const locale = getServerLang(localeParam);
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

  // Sprint E.4 (29 avril 2026) — fetch annotations prof côté serveur pour
  // affichage en post-it sous chaque paragraphe officiel. Dégradation
  // gracieuse : si erreur ou anonyme, retourne array vide (cf. helper).
  const initialAnnotations = await (async () => {
    try {
      const supabase = await createSupabaseServerClient();
      return await fetchStudentAnnotations(supabase, slug, locale);
    } catch (err) {
      console.warn("[exercice page] fetchStudentAnnotations failed:", err);
      return [];
    }
  })();

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

  // Session prefix for "similar exercises" (e.g. "s3" from "s3-01")
  const sessionPrefix = slug.match(/^(s\d+)-/)?.[1] ?? null;
  const allExercises = await getExercisesIndex(locale);
  const sessionExercises = sessionPrefix
    ? allExercises
        .filter((e) => e.slug.startsWith(`${sessionPrefix}-`) && e.slug !== slug)
        .slice(0, 6)
    : [];

  // Ordered session siblings for swipe navigation (including current)
  const sessionSiblings = sessionPrefix
    ? allExercises
        .filter((e) => e.slug.startsWith(`${sessionPrefix}-`))
        .sort((a, b) => a.slug.localeCompare(b.slug))
        .map((e) => ({ slug: e.slug, title: e.title }))
    : [];

  const complementaryExercises = getComplementaryExercises(slug, allExercises);
  const primaryMuscle = (baseFrontmatter as { muscles?: string[] }).muscles?.[0] ?? null;

  return (
    <section className="page pb-6">
      <Breadcrumbs
        items={[
          { label: t("nav.home.label"), href: "/" },
          { label: t("breadcrumbs.exercices"), href: "/exercices" },
          { label: exerciseTitle },
        ]}
      />

      <ExerciseLiveDetail
        key={`${slug}-${locale}`}
        slug={slug}
        locale={locale}
        source={source}
        baseFrontmatter={baseFrontmatter}
        baseContent={baseContent}
        initialPatch={initialPatch}
        onRevalidate={revalidateExercises}
        sessionSiblings={sessionSiblings}
        initialAnnotations={initialAnnotations}
      />

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

      {primaryMuscle && <LastWorkedBadge muscleGroup={primaryMuscle} />}

      {complementaryExercises.length > 0 ? (
        <ComplementaryExercises
          exercises={complementaryExercises.map((e) => ({ slug: e.slug, title: e.title, muscles: e.muscles }))}
          heading={t("exerciseDetail.complementary")}
        />
      ) : null}

      {sessionExercises.length > 0 ? (
        <SessionExercises
          exercises={sessionExercises.map((e) => ({ slug: e.slug, title: e.title }))}
          heading={t("exerciseDetail.sessionExercises")}
        />
      ) : null}
    </section>
  );
}
