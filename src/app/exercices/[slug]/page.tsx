import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getExercise } from "@/lib/content/fs";
import { applyExercisePatch } from "@/lib/live/patch";
import { fetchExerciseOverride, fetchLiveExercise } from "@/lib/live/queries";
import type { Lang } from "@/lib/i18n/messages";
import { ExerciseLiveDetail } from "@/app/exercices/[slug]/ExerciseLiveDetail";

type ExercicePageProps = {
  params: Promise<{ slug: string }>;
};

const LANG_COOKIE = "eps_lang";

function getInitialLang(value?: string): Lang {
  return value === "en" ? "en" : "fr";
}

export async function generateMetadata({
  params,
}: ExercicePageProps): Promise<Metadata> {
  const { slug } = await params;
  const cookieStore = await cookies();
  const locale = getInitialLang(cookieStore.get(LANG_COOKIE)?.value);
  const result = await getExercise(slug);
  const liveExercise = result ? null : await fetchLiveExercise(slug, locale);

  if (!result && !liveExercise) {
    return { title: "Exercice introuvable" };
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
  const result = await getExercise(slug);
  const liveExercise = result ? null : await fetchLiveExercise(slug, locale);

  if (!result && !liveExercise) {
    notFound();
  }

  const baseFrontmatter = result
    ? result.frontmatter
    : liveExercise!.data_json.frontmatter;
  const baseContent = result ? result.content : liveExercise!.data_json.content;
  const override = await fetchExerciseOverride(slug, locale);
  const initialPatch = override?.patch_json ?? null;

  return (
    <section className="page">
      <ExerciseLiveDetail
        key={`${slug}-${locale}`}
        slug={slug}
        locale={locale}
        source={result ? "mdx" : "live"}
        baseFrontmatter={baseFrontmatter}
        baseContent={baseContent}
        initialPatch={initialPatch}
      />
    </section>
  );
}
