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
    const muscles = v2Exercise.musclesList ?? v2Exercise.muscles;
    const equipment = v2Exercise.equipmentList ?? v2Exercise.equipment;
    const difficulty = v2Exercise.difficulty ?? v2Exercise.level;
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
            {v2Exercise.videoSrc ? (
              <video
                src={v2Exercise.videoSrc}
                poster={v2Exercise.imageSrc}
                autoPlay
                loop
                muted
                controls
                preload="metadata"
                playsInline
                className="h-auto w-full object-cover"
              >
                Votre navigateur ne supporte pas la lecture vidéo.
              </video>
            ) : (
              <Image
                src={v2Exercise.imageSrc}
                alt={v2Exercise.title}
                width={960}
                height={720}
                className="h-auto w-full object-cover"
              />
            )}
          </div>
          <div className="space-y-6">
            {v2Exercise.summary ? (
              <section className="space-y-2">
                <h2 className="text-base font-semibold text-[color:var(--ink)]">
                  Résumé
                </h2>
                <p className="text-sm text-[color:var(--ink)]">
                  {v2Exercise.summary}
                </p>
              </section>
            ) : null}
            {v2Exercise.executionSteps?.length ? (
              <section className="space-y-2">
                <h2 className="text-base font-semibold text-[color:var(--ink)]">
                  Exécution
                </h2>
                <ul className="list-disc space-y-1 pl-5 text-sm text-[color:var(--ink)]">
                  {v2Exercise.executionSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
              </section>
            ) : null}
            {v2Exercise.breathing ? (
              <section className="space-y-2">
                <h2 className="text-base font-semibold text-[color:var(--ink)]">
                  Respiration
                </h2>
                <p className="text-sm text-[color:var(--ink)]">
                  {v2Exercise.breathing}
                </p>
              </section>
            ) : null}
            {v2Exercise.tips?.length ? (
              <section className="space-y-2">
                <h2 className="text-base font-semibold text-[color:var(--ink)]">
                  Conseils
                </h2>
                <ul className="list-disc space-y-1 pl-5 text-sm text-[color:var(--ink)]">
                  {v2Exercise.tips.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </section>
            ) : null}
            {v2Exercise.commonMistakes?.length ? (
              <section className="space-y-2">
                <h2 className="text-base font-semibold text-[color:var(--ink)]">
                  Erreurs fréquentes
                </h2>
                <ul className="list-disc space-y-1 pl-5 text-sm text-[color:var(--ink)]">
                  {v2Exercise.commonMistakes.map((mistake) => (
                    <li key={mistake}>{mistake}</li>
                  ))}
                </ul>
              </section>
            ) : null}
            {v2Exercise.safety?.length ? (
              <section className="space-y-2">
                <h2 className="text-base font-semibold text-[color:var(--ink)]">
                  Sécurité
                </h2>
                <ul className="list-disc space-y-1 pl-5 text-sm text-[color:var(--ink)]">
                  {v2Exercise.safety.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null}
            {muscles?.length || equipment?.length || difficulty ? (
              <section className="space-y-2">
                <h2 className="text-base font-semibold text-[color:var(--ink)]">
                  Muscles / Matériel / Difficulté
                </h2>
                <div className="grid gap-4 text-sm text-[color:var(--ink)] md:grid-cols-3">
                  {muscles?.length ? (
                    <div className="space-y-1">
                      <p className="font-semibold">Muscles</p>
                      <ul className="list-disc space-y-1 pl-5">
                        {muscles.map((muscle) => (
                          <li key={muscle}>{muscle}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {equipment?.length ? (
                    <div className="space-y-1">
                      <p className="font-semibold">Matériel</p>
                      <ul className="list-disc space-y-1 pl-5">
                        {equipment.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {difficulty ? (
                    <div className="space-y-1">
                      <p className="font-semibold">Difficulté</p>
                      <p>{difficulty}</p>
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}
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
