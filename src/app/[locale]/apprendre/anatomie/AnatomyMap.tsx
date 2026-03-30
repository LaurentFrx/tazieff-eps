"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { LocaleLink as Link } from "@/components/LocaleLink";
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { LiveExerciseListItem } from "@/lib/live/types";
import { MUSCLE_GROUPS, POSTERIOR_GROUPS, LAYERED_GROUPS, matchesGroup, getLayeredMuscles, getSubMuscleColor, isLayeredGroup } from "./anatomy-data";
import "./anatomy.css";

const AnatomyCanvas = dynamic(() => import("./AnatomyCanvas"), {
  ssr: false,
  loading: () => <div className="anatomy-loading">Initializing 3D…</div>,
});

type Props = {
  exercises: LiveExerciseListItem[];
};

/* ─── Main component ──────────────────────────────────────────────────── */

export default function AnatomyMap({ exercises }: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [highlightedMuscle, setHighlightedMuscle] = useState<string | null>(null);
  const [legendOpen, setLegendOpen] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [showWireframe, setShowWireframe] = useState(true);
  const [showMuscles, setShowMuscles] = useState(true);

  // Pre-highlight groups from URL (?muscles=pectoraux,epaules&from=exercice&slug=s3-03)
  const urlMuscleGroups = useMemo(
    () => searchParams.get("muscles")?.split(",").filter((k) => k in MUSCLE_GROUPS) ?? [],
    [searchParams],
  );
  const fromExercice = searchParams.get("from") === "exercice";
  const returnSlug = searchParams.get("slug") ?? "";

  // Compute initial rotation: if majority posterior → show back (PI)
  const initialRotationY = useMemo(() => {
    if (urlMuscleGroups.length === 0) return 0;
    const posteriorCount = urlMuscleGroups.filter((k) => POSTERIOR_GROUPS.has(k)).length;
    return posteriorCount > urlMuscleGroups.length / 2 ? Math.PI : 0;
  }, [urlMuscleGroups]);

  /* ── Exercise count for selected group ─────────────────────────────── */
  const groupExerciseCount = useMemo(() => {
    if (!selectedGroup) return 0;
    const group = MUSCLE_GROUPS[selectedGroup];
    if (!group) return 0;
    return exercises.filter((ex) =>
      ex.muscles.some((m) => matchesGroup(group, m)),
    ).length;
  }, [selectedGroup, exercises]);

  /* ── Layered muscles for the selected group (null if non-layered) ─── */
  const layeredMuscles = useMemo(
    () => (selectedGroup ? getLayeredMuscles(selectedGroup) : null),
    [selectedGroup],
  );

  /* ── Clear all selection ───────────────────────────────────────────── */
  const clearSelection = useCallback(() => {
    setSelectedGroup(null);
    setHighlightedMuscle(null);
  }, []);

  /* ── Tap on muscle → select group (or toggle highlight in exercise mode) */
  const handleClickMuscle = useCallback(
    (frName: string | null, groupKey: string | null, _x: number, _y: number) => {
      if (!frName || !groupKey) {
        clearSelection();
        return;
      }

      // Exercise mode: toggle highlight directly, never change selectedGroup
      if (fromExercice) {
        if (highlightedMuscle === frName) {
          setHighlightedMuscle(null);
        } else {
          setHighlightedMuscle(frName);
        }
        return;
      }

      // Normal anatomy page: existing behavior
      if (groupKey === selectedGroup && layeredMuscles) {
        if (highlightedMuscle === frName) {
          setHighlightedMuscle(null);
        } else {
          setHighlightedMuscle(frName);
        }
        return;
      }
      setSelectedGroup(groupKey);
      setHighlightedMuscle(null);
    },
    [selectedGroup, layeredMuscles, highlightedMuscle, clearSelection, fromExercice],
  );

  /* ── Sub-muscle chip toggle ────────────────────────────────────────── */
  const handleChipSelect = useCallback(
    (muscleName: string) => {
      if (highlightedMuscle === muscleName) {
        setHighlightedMuscle(null);
      } else {
        setHighlightedMuscle(muscleName);
      }
    },
    [highlightedMuscle],
  );

  /* ── Long press → same as tap (no separate behavior) ───────────────── */
  const handleLongPressMuscle = useCallback(
    (frName: string, groupKey: string, _x: number, _y: number) => {
      if (fromExercice) {
        setHighlightedMuscle((prev) => (prev === frName ? null : frName));
      } else {
        setSelectedGroup(groupKey);
        setHighlightedMuscle(frName);
      }
    },
    [fromExercice],
  );

  /* ── Hover (no-op — hover tooltip removed) ─────────────────────────── */
  const handleHoverMuscle = useCallback(
    (_frName: string | null, _groupKey: string | null) => {},
    [],
  );

  /* ── Legend group select → highlight ─────────────────────────────────── */
  const handleLegendSelect = useCallback((key: string) => {
    setSelectedGroup((prev) => (prev === key ? null : key));
    setHighlightedMuscle(null);
    setLegendOpen(false);
  }, []);

  return (
    <div className="anatomy-page fixed inset-0 z-[60]">
      {/* ── Back button (top left) ────────────────────────────────── */}
      {fromExercice && returnSlug ? (
        <Link
          href={`/exercices/${returnSlug}`}
          className="anatomy-back-btn anatomy-back-exercise"
        >
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="anatomy-back-icon">
            <path d="M12 4l-6 6 6 6" />
          </svg>
          <span>{t("anatomy.backToExercise")}</span>
        </Link>
      ) : (
        <button
          type="button"
          className="anatomy-back-btn"
          onClick={() => router.back()}
          aria-label={t("anatomy.close")}
        >
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="anatomy-back-icon">
            <path d="M12 4l-6 6 6 6" />
          </svg>
        </button>
      )}

      <div className="anatomy-layout">
        {/* ── 3D Canvas (full viewport) ──────────────────────────────── */}
        <div className="anatomy-canvas-wrap">
          <AnatomyCanvas
            selectedGroup={selectedGroup}
            highlightedMuscle={highlightedMuscle}
            activeGroups={!selectedGroup ? urlMuscleGroups : undefined}
            initialRotationY={initialRotationY}
            showSkeleton={showSkeleton}
            showWireframe={showWireframe}
            showMuscles={showMuscles}
            onHoverMuscle={handleHoverMuscle}
            onClickMuscle={handleClickMuscle}
            onLongPressMuscle={handleLongPressMuscle}
          />
        </div>
      </div>

      {/* ── Exercise mode: simple muscle label at bottom ─────────────── */}
      {fromExercice && highlightedMuscle && (
        <div className="anatomy-exercise-label">
          <span className="anatomy-exercise-label-name">{highlightedMuscle}</span>
          <button
            type="button"
            className="anatomy-submenu-close"
            onClick={() => setHighlightedMuscle(null)}
            aria-label={t("anatomy.close")}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="2" y1="2" x2="12" y2="12"/><line x1="12" y1="2" x2="2" y2="12"/></svg>
          </button>
        </div>
      )}

      {/* ── Bottom sheet (unified — group + chips + exercise link) ────── */}
      {!fromExercice && selectedGroup && (
        <div className="anatomy-submenu">
          <div className="anatomy-submenu-header">
            <div className="anatomy-submenu-title-row">
              <span
                className="anatomy-submenu-accent"
                style={{ background: MUSCLE_GROUPS[selectedGroup]?.color }}
              />
              <span className="anatomy-submenu-group-title">{t(`anatomy.groups.${selectedGroup}`)}</span>
            </div>
            <button
              type="button"
              className="anatomy-submenu-close"
              onClick={clearSelection}
              aria-label={t("anatomy.close")}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="2" y1="2" x2="12" y2="12"/><line x1="12" y1="2" x2="2" y2="12"/></svg>
            </button>
          </div>
          {layeredMuscles && (
            <div className="anatomy-submenu-chips">
              {layeredMuscles.map((muscle) => (
                <button
                  key={muscle}
                  type="button"
                  className={`anatomy-submenu-chip${highlightedMuscle === muscle ? " anatomy-submenu-chip--active" : ""}`}
                  style={highlightedMuscle === muscle ? { borderColor: getSubMuscleColor(selectedGroup, muscle) ?? undefined } : undefined}
                  onClick={() => handleChipSelect(muscle)}
                >
                  <span
                    className="anatomy-group-dot"
                    style={{ background: getSubMuscleColor(selectedGroup, muscle) ?? MUSCLE_GROUPS[selectedGroup]?.color }}
                  />
                  {muscle}
                </button>
              ))}
            </div>
          )}
          {groupExerciseCount > 0 ? (
            <Link
              href={`/exercices?muscle=${selectedGroup}&from=anatomie`}
              className="anatomy-submenu-exercise-btn"
              style={{ background: MUSCLE_GROUPS[selectedGroup]?.color }}
            >
              {`${t("anatomy.seeThe")} ${groupExerciseCount} ${groupExerciseCount === 1 ? t("anatomy.exerciseCount") : t("anatomy.exerciseCountPlural")}`}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="8" x2="13" y2="8"/><polyline points="9,4 13,8 9,12"/></svg>
            </Link>
          ) : null}
        </div>
      )}

      {/* ── Layer toolbar (top right): [🦴] [◇] [💪] [☰] ───────────────── */}
      <div className="anatomy-toolbar">
        <button
          type="button"
          className={`anatomy-toolbar-btn${showSkeleton ? " anatomy-toolbar-btn--active" : ""}`}
          onClick={() => setShowSkeleton((s) => !s)}
          aria-label={t("anatomy.toggleSkeleton")}
        >
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="anatomy-toolbar-icon">
            <circle cx="10" cy="4" r="2.5" />
            <line x1="10" y1="6.5" x2="10" y2="14" />
            <line x1="6" y1="9" x2="14" y2="9" />
            <line x1="10" y1="14" x2="7" y2="18" />
            <line x1="10" y1="14" x2="13" y2="18" />
          </svg>
        </button>
        <button
          type="button"
          className={`anatomy-toolbar-btn${showWireframe ? " anatomy-toolbar-btn--active" : ""}`}
          onClick={() => setShowWireframe((s) => !s)}
          aria-label={t("anatomy.toggleWireframe")}
        >
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="anatomy-toolbar-icon">
            <path d="M10 2L18 10L10 18L2 10Z" />
            <line x1="10" y1="2" x2="10" y2="18" strokeWidth="1" />
            <line x1="2" y1="10" x2="18" y2="10" strokeWidth="1" />
          </svg>
        </button>
        <button
          type="button"
          className={`anatomy-toolbar-btn${showMuscles ? " anatomy-toolbar-btn--active" : ""}`}
          onClick={() => setShowMuscles((s) => !s)}
          aria-label={t("anatomy.toggleMuscles")}
        >
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="anatomy-toolbar-icon">
            <path d="M7 16C5 14 4 11 5 8C6 5 8 4 10 4C12 4 14 5 15 8C16 11 15 14 13 16" />
            <path d="M8 10C9 8 11 8 12 10" />
          </svg>
        </button>
        {!fromExercice && (
        <button
          type="button"
          className={`anatomy-toolbar-btn${legendOpen ? " anatomy-toolbar-btn--active" : ""}`}
          onClick={() => setLegendOpen((o) => !o)}
          aria-label={t("anatomy.openMenu")}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="anatomy-toolbar-icon">
            <rect x="3" y="4" width="14" height="2" rx="1" />
            <rect x="3" y="9" width="14" height="2" rx="1" />
            <rect x="3" y="14" width="14" height="2" rx="1" />
          </svg>
        </button>
        )}
      </div>

      {/* ── Side panel (muscle index) — hidden in exercise mode ─────────── */}
      {!fromExercice && legendOpen && (
        <>
          <div className="anatomy-backdrop" onClick={() => setLegendOpen(false)} />
          <div className="anatomy-side-panel">
            <div className="anatomy-side-panel-title">{t("anatomy.systemTitle")}</div>
            {Object.entries(MUSCLE_GROUPS).map(([key, group]) => (
              <div key={key}>
                <button
                  type="button"
                  className={`anatomy-legend-item${selectedGroup === key ? " anatomy-legend-item--active" : ""}`}
                  onClick={() => handleLegendSelect(key)}
                >
                  <span className="anatomy-group-dot" style={{ background: group.color }} />
                  {t(`anatomy.groups.${key}`)}
                </button>
                {isLayeredGroup(key) && LAYERED_GROUPS[key].map((sub) => (
                  <div key={sub.name} className="anatomy-legend-sub">
                    <span className="anatomy-group-dot" style={{ background: sub.color }} />
                    {sub.name}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
