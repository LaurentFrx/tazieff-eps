"use client";

import { LocaleLink as Link } from "@/components/LocaleLink";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { getMuscleGroups, MUSCLE_GROUP_COLORS, type MuscleGroupId } from "@/lib/exercices/muscleGroups";
import "./exercise-anatomy.css";

type Props = {
  muscles: string[];
  translatedMuscles: string[];
  slug: string;
};

export default function ExerciseAnatomyThumb({
  muscles,
  translatedMuscles,
  slug,
}: Props) {
  const { t } = useI18n();

  // 8 unified groups for badge display
  const groupKeys = getMuscleGroups(muscles);

  /* No matched groups → fallback to text chips */
  if (groupKeys.length === 0) {
    return (
      <div className="flex flex-wrap gap-2">
        {translatedMuscles.map((muscle, i) => (
          <span
            key={muscles[i]}
            className="inline-flex items-center rounded-full bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400 px-3 py-1 text-xs font-medium"
          >
            {muscle}
          </span>
        ))}
      </div>
    );
  }

  // Use unified 8-group keys for anatomy page link
  const href = `/apprendre/anatomie?muscles=${groupKeys.join(",")}&from=exercice&slug=${slug}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: "100%" }}>
      <div className="exo-anatomy-thumb-labels">
        {groupKeys.map((key) => (
          <span key={key} className="exo-anatomy-thumb-label">
            <span
              className="exo-anatomy-thumb-dot"
              style={{ background: MUSCLE_GROUP_COLORS[key as MuscleGroupId] ?? "#888" }}
            />
            {t(`filters.muscleGroups.${key}`)}
          </span>
        ))}
      </div>
      <Link
        href={href}
        className="exo-anatomy-thumb tap-feedback"
        aria-label={t("exerciseAnatomy.musclesWorked")}
        style={{ width: "100%", height: 320, position: "relative", display: "block" }}
      >
        <img
          src="/images/anatomy/mini-mannequin.webp"
          alt={t("exerciseAnatomy.musclesWorked")}
          data-testid="mannequin-img"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            objectPosition: "center 10%",
            pointerEvents: "none",
          }}
          loading="lazy"
        />
      </Link>
      <div
        style={{
          marginTop: 8,
          textAlign: "center",
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          opacity: 0.4,
          color: "white",
        }}
      >
        {t("exerciseAnatomy.tapToExplore")}
      </div>
    </div>
  );
}
