import Image from "next/image";
import type { Metadata } from "next";
import { revalidatePath, revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getExercise } from "@/lib/content/fs";
import { getV2ImportIndex } from "@/lib/exercices/getV2ImportIndex";
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

async function revalidateExercises(slug: string) {
  "use server";
  revalidateTag("exercises", "max");
  revalidatePath("/exercices");
  revalidatePath(`/exercices/${slug}`, "page");
}

async function getV2Exercise(slug: string) {
  const v2Items = await getV2ImportIndex();
  return v2Items.find((item) => item.slug === slug) ?? null;
}

export async function generateMetadata({
  params,
}: ExercicePageProps): Promise<Metadata> {
  const { slug } = await params;
  const cookieStore = await cookies();
  const locale = getInitialLang(cookieStore.get(LANG_COOKIE)?.value);
  const result = await getExercise(slug);
  const liveExercise = result ? null : await fetchLiveExercise(slug, locale);

  const v2Exercise = result || liveExercise ? null : await getV2Exercise(slug);

  if (!result && !liveExercise && !v2Exercise) {
    return { title: "Exercice introuvable" };
  }

  if (v2Exercise) {
    return { title: v2Exercise.title };
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
  const v2Exercise = result || liveExercise ? null : await getV2Exercise(slug);

  if (!result && !liveExercise && !v2Exercise) {
    notFound();
  }

  if (v2Exercise && !result && !liveExercise) {
    return (
      <section className="page">
        <article className="card space-y-4">
          <div className="inline-flex items-center gap-2 text-xs text-[color:var(--muted)]">
            <span className="rounded-full border border-white/10 px-2 py-1">
              Source v2 import
            </span>
            <span>Fiche importée</span>
          </div>
          <h1 className="text-xl font-semibold text-[color:var(--ink)]">
            {v2Exercise.title}
          </h1>
          <div className="overflow-hidden rounded-[var(--radius)] border border-white/10">
            <Image
              src={v2Exercise.imageSrc}
              alt={v2Exercise.title}
              width={960}
              height={720}
              className="h-auto w-full object-cover"
            />
          </div>
        </article>
      </section>
    );
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
        onRevalidate={revalidateExercises}
      />
    </section>
  );
}
