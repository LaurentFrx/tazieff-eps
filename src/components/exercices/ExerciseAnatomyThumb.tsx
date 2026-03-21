"use client";

import Link from "next/link";
import NextImage from "next/image";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { MUSCLE_GROUPS } from "@/app/apprendre/anatomie/anatomy-data";
import { getExerciseMuscleGroups } from "@/lib/exercices/muscle-groups";
import miniMannequin from "../../../public/images/anatomy/mini-mannequin.webp";
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

  const groupKeys = getExerciseMuscleGroups(muscles);

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

  const href = `/apprendre/anatomie?muscles=${groupKeys.join(",")}&from=exercice&slug=${slug}`;

  return (
    <Link
      href={href}
      className="exo-anatomy-thumb"
      aria-label={t("exerciseAnatomy.musclesWorked")}
    >
      <NextImage
        src={miniMannequin}
        alt={t("exerciseAnatomy.musclesWorked")}
        className="exo-anatomy-thumb-img"
        fill
        sizes="(min-width: 768px) 150px, 120px"
        priority={false}
      />
      <div className="exo-anatomy-thumb-labels">
        {groupKeys.slice(0, 5).map((key) => (
          <span key={key} className="exo-anatomy-thumb-label">
            <span
              className="exo-anatomy-thumb-dot"
              style={{ background: MUSCLE_GROUPS[key]?.color }}
            />
            {t(`anatomy.groups.${key}`)}
          </span>
        ))}
        {groupKeys.length > 5 && (
          <span className="exo-anatomy-thumb-label">
            +{groupKeys.length - 5}
          </span>
        )}
      </div>
      <div className="exo-anatomy-thumb-hint">
        {t("exerciseAnatomy.tapToExplore")}
      </div>
    </Link>
  );
}
