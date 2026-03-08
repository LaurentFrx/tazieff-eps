"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { MUSCLE_GROUPS } from "@/app/apprendre/anatomie/anatomy-data";
import {
  getExerciseMuscleGroups,
  isPosteriorDominant,
} from "@/lib/exercices/muscle-groups";
import "./exercise-anatomy.css";

const ThumbCanvas = dynamic(() => import("./ExerciseAnatomyThumbCanvas"), {
  ssr: false,
  loading: () => null,
});

const ExerciseAnatomyModal = dynamic(
  () => import("./ExerciseAnatomyModal"),
  { ssr: false },
);

type Props = {
  muscles: string[];
  translatedMuscles: string[];
};

export default function ExerciseAnatomyThumb({
  muscles,
  translatedMuscles,
}: Props) {
  const { t } = useI18n();
  const [modalOpen, setModalOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  const groupKeys = getExerciseMuscleGroups(muscles);
  const posterior = isPosteriorDominant(groupKeys);

  /* 3-second timeout fallback */
  useEffect(() => {
    if (loaded) return;
    const timer = setTimeout(() => {
      if (!loaded) setTimedOut(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, [loaded]);

  const handleOpen = useCallback(() => setModalOpen(true), []);
  const handleClose = useCallback(() => setModalOpen(false), []);
  const handleLoaded = useCallback(() => setLoaded(true), []);

  /* No matched groups or timed out → fallback to text chips */
  if (groupKeys.length === 0 || (timedOut && !loaded)) {
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

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="exo-anatomy-thumb"
        aria-label={t("exerciseAnatomy.musclesWorked")}
      >
        <ThumbCanvas
          groupKeys={groupKeys}
          posterior={posterior}
          onLoaded={handleLoaded}
        />
        <div className="exo-anatomy-thumb-labels">
          {groupKeys.slice(0, 4).map((key) => (
            <span key={key} className="exo-anatomy-thumb-label">
              <span
                className="exo-anatomy-thumb-dot"
                style={{ background: MUSCLE_GROUPS[key]?.color }}
              />
              {t(`anatomy.groups.${key}`)}
            </span>
          ))}
          {groupKeys.length > 4 && (
            <span className="exo-anatomy-thumb-label">
              +{groupKeys.length - 4}
            </span>
          )}
        </div>
        <div className="exo-anatomy-thumb-hint">
          {t("exerciseAnatomy.tapToExplore")}
        </div>
      </button>

      {modalOpen &&
        createPortal(
          <ExerciseAnatomyModal
            muscles={muscles}
            groupKeys={groupKeys}
            onClose={handleClose}
          />,
          document.body,
        )}
    </>
  );
}
