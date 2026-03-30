"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import NextImage from "next/image";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { getExerciseMuscleGroups } from "@/lib/exercices/muscle-groups";
import { MUSCLE_GROUPS, matchesGroup } from "@/app/[locale]/apprendre/anatomie/anatomy-data";
import { getAnatomyAnim } from "@/lib/storage";
import miniMannequin from "../../../public/images/anatomy/mini-mannequin.webp";
import "./exercise-anatomy.css";

const GROUP_COLORS: Record<string, string> = {
  dos: "#3b82f6",
  "membres-inferieurs": "#22c55e",
  "membres-superieurs": "#f97316",
  abdominaux: "#a855f7",
  pectoraux: "#ef4444",
};

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
  const thumbRef = useRef<HTMLAnchorElement>(null);
  const [scanning, setScanning] = useState(false);
  const [scanDone, setScanDone] = useState(false);
  const hasTriggered = useRef(false);

  // 5 simplified groups for badge display
  const groupKeys = getExerciseMuscleGroups(muscles);

  // Trigger scan animation via IntersectionObserver
  const startScan = useCallback(() => {
    if (hasTriggered.current) return;
    hasTriggered.current = true;
    if (!getAnatomyAnim()) {
      setScanDone(true);
      return;
    }
    setScanning(true);
    // Scan duration = 1s, then mark done
    const timer = setTimeout(() => {
      setScanning(false);
      setScanDone(true);
    }, 1100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const el = thumbRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) startScan(); },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [startScan]);

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

  const showInitial = !scanning && !scanDone;

  return (
    <Link
      ref={thumbRef}
      href={href}
      className={`exo-anatomy-thumb${scanning ? " exo-anatomy-thumb--scanning" : ""}${showInitial ? " exo-anatomy-thumb--pre-scan" : ""}`}
      aria-label={t("exerciseAnatomy.musclesWorked")}
    >
      {/* Dimmed base image (visible during scan) */}
      <NextImage
        src={miniMannequin}
        alt={t("exerciseAnatomy.musclesWorked")}
        className={`exo-anatomy-thumb-img${showInitial ? " exo-anatomy-thumb-img--dim" : ""}`}
        fill
        sizes="(min-width: 768px) 150px, 120px"
        priority={false}
      />
      {/* Bright reveal image (clips open during scan) */}
      {scanning && (
        <div className="exo-anatomy-scan-reveal" aria-hidden="true">
          <NextImage
            src={miniMannequin}
            alt=""
            className="exo-anatomy-thumb-img"
            fill
            sizes="(min-width: 768px) 150px, 120px"
            priority={false}
          />
        </div>
      )}
      {/* Scan line */}
      {scanning && <div className="exo-anatomy-scan-line" aria-hidden="true" />}
      {/* Labels */}
      <div className={`exo-anatomy-thumb-labels${scanning ? " exo-anatomy-scan-labels" : ""}`}>
        {groupKeys.map((key, i) => (
          <span
            key={key}
            className="exo-anatomy-thumb-label"
            style={scanning ? { animationDelay: `${0.2 + i * 0.15}s` } : undefined}
          >
            <span
              className="exo-anatomy-thumb-dot"
              style={{ background: GROUP_COLORS[key] ?? "#888" }}
            />
            {t(`filters.muscleGroups.${key}`)}
          </span>
        ))}
      </div>
      <div className="exo-anatomy-thumb-hint">
        {t("exerciseAnatomy.tapToExplore")}
      </div>
    </Link>
  );
}
