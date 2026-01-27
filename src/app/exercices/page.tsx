import { cookies } from "next/headers";
import { exercisesIndex } from "@/lib/content/fs";
import { ExerciseListClient } from "@/app/exercices/ExerciseListClient";
import type { Lang } from "@/lib/i18n/messages";
import { fetchLiveExercises } from "@/lib/live/queries";

const LANG_COOKIE = "eps_lang";

function getInitialLang(value?: string): Lang {
  return value === "en" ? "en" : "fr";
}

export default async function ExercicesPage() {
  const cookieStore = await cookies();
  const locale = getInitialLang(cookieStore.get(LANG_COOKIE)?.value);
  const exercises = await exercisesIndex();
  const liveExercises = await fetchLiveExercises(locale);

  return (
    <section className="page">
      <ExerciseListClient
        exercises={exercises}
        liveExercises={liveExercises}
        locale={locale}
      />
    </section>
  );
}
