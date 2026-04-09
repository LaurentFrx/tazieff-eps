"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/I18nProvider";
import {
  getExerciseMuscleGroups,
  getExerciseMuscleGroupsWithColors,
  GROUP_COLORS,
} from "@/lib/exercices/muscle-groups";
import { MUSCLE_GROUPS, matchesGroup } from "@/app/[locale]/apprendre/anatomie/anatomy-data";
import MuscleHighlightSVG from "./MuscleHighlightSVG";
import "./exercise-anatomy.css";

// IMPORTANT : bug récurrent. Ne pas supprimer ce filtrage.
// Quand ouvert depuis un exercice, seuls les muscles de l'exercice sont surlignés.
// Les exerciseSearchTerms dans anatomy-data ne doivent contenir QUE des noms
// de muscles, jamais des noms de mouvements (rotation, extension, gainage…).
function getAnatomyGroupKeys(muscles: string[]): string[] {
  const groups = new Set<string>();
  for (const muscle of muscles) {
    for (const [key, group] of Object.entries(MUSCLE_GROUPS)) {
      if (matchesGroup(group, muscle)) {
        groups.add(key);
      }
    }
  }
  return Array.from(groups);
}

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

  // 5 simplified groups for badge display
  const groupKeys = getExerciseMuscleGroups(muscles);
  const groupsWithColors = getExerciseMuscleGroupsWithColors(muscles);

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

  // anatomy-data groups for the anatomy page link
  const anatomyKeys = getAnatomyGroupKeys(muscles);
  const href = `/apprendre/anatomie?muscles=${anatomyKeys.join(",")}&from=exercice&slug=${slug}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: "100%" }}>
      <div className="exo-anatomy-thumb-labels">
        {groupKeys.map((key) => (
          <span key={key} className="exo-anatomy-thumb-label">
            <span
              className="exo-anatomy-thumb-dot"
              style={{ background: GROUP_COLORS[key] ?? "#888" }}
            />
            {t(`filters.muscleGroups.${key}`)}
          </span>
        ))}
      </div>
      <Link
        href={href}
        className="exo-anatomy-thumb tap-feedback"
        aria-label={t("exerciseAnatomy.musclesWorked")}
        style={{ width: "100%", height: 320, position: "relative", display: "block", overflow: "hidden", borderRadius: 16 }}
      >
        <MuscleHighlightSVG
          activeGroups={groupsWithColors}
          width={280}
          height={320}
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
