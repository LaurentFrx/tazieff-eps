"use client";

import { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { LiveExerciseListItem } from "@/lib/live/types";
import { MUSCLE_GROUPS, GROUP_MUSCLES, matchesGroup, getLayeredMuscles } from "./anatomy-data";
import "./anatomy.css";

const AnatomyCanvas = dynamic(() => import("./AnatomyCanvas"), {
  ssr: false,
  loading: () => <div className="anatomy-loading">Initializing 3D…</div>,
});

type Props = {
  exercises: LiveExerciseListItem[];
};

type LabelInfo = {
  name: string;
  groupKey: string;
  x: number;
  y: number;
};

/* ─── Main component ──────────────────────────────────────────────────── */

export default function AnatomyMap({ exercises }: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [highlightedMuscle, setHighlightedMuscle] = useState<string | null>(null);
  const [label, setLabel] = useState<LabelInfo | null>(null);
  const [sheetGroupKey, setSheetGroupKey] = useState<string | null>(null);
  const [legendOpen, setLegendOpen] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [layeredSubmenu, setLayeredSubmenu] = useState<{
    groupKey: string;
    muscles: string[];
    x: number;
    y: number;
  } | null>(null);

  /* ── Exercises matching sheet group ──────────────────────────────────── */
  const sheetExercises = useMemo(() => {
    if (!sheetGroupKey) return [];
    const group = MUSCLE_GROUPS[sheetGroupKey];
    if (!group) return [];
    return exercises.filter((ex) =>
      ex.muscles.some((m) => matchesGroup(group, m)),
    );
  }, [sheetGroupKey, exercises]);

  /* ── Tap on muscle → floating label (or sub-menu for layered groups) ── */
  const handleClickMuscle = useCallback(
    (frName: string | null, groupKey: string | null, x: number, y: number) => {
      if (!frName || !groupKey) {
        setLabel(null);
        setSelectedGroup(null);
        setHighlightedMuscle(null);
        setLayeredSubmenu(null);
        return;
      }

      const layers = getLayeredMuscles(groupKey);
      if (layers) {
        // Layered group: highlight whole group + show sub-menu picker
        setSelectedGroup(groupKey);
        setHighlightedMuscle(null);
        setLabel(null);
        setLayeredSubmenu({ groupKey, muscles: layers, x, y });
        return;
      }

      // Non-layered: existing behavior
      setLayeredSubmenu(null);
      setLabel({ name: frName, groupKey, x, y });
      setSelectedGroup(groupKey);
      setHighlightedMuscle(frName);
    },
    [],
  );

  /* ── Sub-muscle selection from layered group sub-menu ─────────────── */
  const handleSubmuscleSelect = useCallback(
    (muscleName: string) => {
      if (!layeredSubmenu) return;
      const { groupKey, x, y } = layeredSubmenu;
      setHighlightedMuscle(muscleName);
      setLayeredSubmenu(null);
      setLabel({ name: muscleName, groupKey, x, y });
    },
    [layeredSubmenu],
  );

  /* ── Long press / dblclick → bottom sheet ───────────────────────────── */
  const handleLongPressMuscle = useCallback(
    (frName: string, groupKey: string, _x: number, _y: number) => {
      setLabel({ name: frName, groupKey, x: _x, y: _y });
      setSelectedGroup(groupKey);
      setHighlightedMuscle(frName);
      setSheetGroupKey(groupKey);
      setLayeredSubmenu(null);
    },
    [],
  );

  /* ── Hover (desktop tooltip) ────────────────────────────────────────── */
  const [tooltip, setTooltip] = useState<{
    name: string;
    group: string | null;
  } | null>(null);

  const handleHoverMuscle = useCallback(
    (frName: string | null, groupKey: string | null) => {
      if (frName) {
        setTooltip({ name: frName, group: groupKey ? MUSCLE_GROUPS[groupKey]?.id : null });
      } else {
        setTooltip(null);
      }
    },
    [],
  );

  /* ── Legend group select → highlight ─────────────────────────────────── */
  const handleLegendSelect = useCallback((key: string) => {
    setSelectedGroup((prev) => (prev === key ? null : key));
    setHighlightedMuscle(null);
    setLabel(null);
    setLayeredSubmenu(null);
    setLegendOpen(false);
  }, []);

  return (
    <div className="anatomy-page fixed inset-0 z-[60]">
      {/* ── Back button (top left) ────────────────────────────────── */}
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

      <div className="anatomy-layout">
        {/* ── 3D Canvas (full viewport) ──────────────────────────────── */}
        <div className="anatomy-canvas-wrap">
          <AnatomyCanvas
            selectedGroup={selectedGroup}
            highlightedMuscle={highlightedMuscle}
            showSkeleton={showSkeleton}
            onHoverMuscle={handleHoverMuscle}
            onClickMuscle={handleClickMuscle}
            onLongPressMuscle={handleLongPressMuscle}
          />

          {/* HUD overlay */}
          <div className="anatomy-hud-overlay">
            <div className="anatomy-hud-top">
              <div className="anatomy-hud">
                {selectedGroup
                  ? `// ${t(`anatomy.groups.${selectedGroup}`)}`
                  : t("anatomy.dataReady")}
              </div>
            </div>
            <div className="anatomy-hud-bottom">
              <div className="anatomy-hud">
                {selectedGroup
                  ? t("anatomy.scanActive")
                  : `${Object.keys(MUSCLE_GROUPS).length} ${t("anatomy.groups_word")}`}
              </div>
            </div>
          </div>

          {/* Desktop hover tooltip */}
          {tooltip && !label && (
            <div className="anatomy-tooltip">
              <div className="anatomy-tooltip-name">{tooltip.name}</div>
              {tooltip.group && (
                <div className="anatomy-tooltip-group">
                  {t(`anatomy.groups.${tooltip.group}`)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Floating label (tap on muscle) ─────────────────────────────── */}
      {label && !layeredSubmenu && (
        <div
          className="anatomy-label"
          style={{
            left: `clamp(16px, ${label.x}px, calc(100vw - 200px))`,
            top: `clamp(16px, ${label.y - 16}px, calc(100vh - 80px))`,
          }}
        >
          <div className="anatomy-label-name">{label.name}</div>
          <div className="anatomy-label-group">
            <span
              className="anatomy-group-dot"
              style={{ background: MUSCLE_GROUPS[label.groupKey]?.color }}
            />
            {t(`anatomy.groups.${label.groupKey}`)}
          </div>
        </div>
      )}

      {/* ── Layered group sub-menu (e.g. abdominaux) ───────────────────── */}
      {layeredSubmenu && (
        <div
          className="anatomy-submenu"
          style={{
            left: `clamp(16px, ${layeredSubmenu.x}px, calc(100vw - 200px))`,
            top: `clamp(16px, ${layeredSubmenu.y - 16}px, calc(100vh - 240px))`,
          }}
        >
          <div className="anatomy-submenu-header">
            <span
              className="anatomy-group-dot"
              style={{ background: MUSCLE_GROUPS[layeredSubmenu.groupKey]?.color }}
            />
            {t(`anatomy.groups.${layeredSubmenu.groupKey}`)}
          </div>
          {layeredSubmenu.muscles.map((muscle) => (
            <button
              key={muscle}
              type="button"
              className="anatomy-submenu-item"
              onClick={() => handleSubmuscleSelect(muscle)}
            >
              {muscle}
            </button>
          ))}
        </div>
      )}

      {/* ── Skeleton toggle button ──────────────────────────────────────── */}
      <button
        type="button"
        className="anatomy-skeleton-btn"
        onClick={() => setShowSkeleton((s) => !s)}
        aria-label={t("anatomy.toggleSkeleton")}
      >
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="anatomy-legend-icon">
          <circle cx="10" cy="4" r="2.5" />
          <line x1="10" y1="6.5" x2="10" y2="14" />
          <line x1="6" y1="9" x2="14" y2="9" />
          <line x1="10" y1="14" x2="7" y2="18" />
          <line x1="10" y1="14" x2="13" y2="18" />
        </svg>
        {showSkeleton && <span className="anatomy-skeleton-dot" />}
      </button>

      {/* ── Legend button (top right) ───────────────────────────────────── */}
      <button
        type="button"
        className="anatomy-legend-btn"
        onClick={() => setLegendOpen((o) => !o)}
        aria-label={t("anatomy.openMenu")}
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="anatomy-legend-icon">
          <rect x="3" y="4" width="14" height="2" rx="1" />
          <rect x="3" y="9" width="14" height="2" rx="1" />
          <rect x="3" y="14" width="14" height="2" rx="1" />
        </svg>
      </button>

      {/* ── Legend overlay ──────────────────────────────────────────────── */}
      {legendOpen && (
        <>
          <div className="anatomy-backdrop" onClick={() => setLegendOpen(false)} />
          <div className="anatomy-legend">
            <div className="anatomy-legend-title">{t("anatomy.systemTitle")}</div>
            {Object.entries(MUSCLE_GROUPS).map(([key, group]) => (
              <button
                key={key}
                type="button"
                className={`anatomy-legend-item${selectedGroup === key ? " anatomy-legend-item--active" : ""}`}
                onClick={() => handleLegendSelect(key)}
              >
                <span className="anatomy-group-dot" style={{ background: group.color }} />
                {t(`anatomy.groups.${key}`)}
              </button>
            ))}
          </div>
        </>
      )}

      {/* ── Bottom sheet (long press / dblclick detail) ─────────────────── */}
      {sheetGroupKey && (
        <>
          <div className="anatomy-backdrop" onClick={() => setSheetGroupKey(null)} />
          <div className="anatomy-sheet">
            <div className="anatomy-sheet-handle" />
            <div className="anatomy-sheet-header">
              <span
                className="anatomy-group-dot"
                style={{ background: MUSCLE_GROUPS[sheetGroupKey]?.color }}
              />
              <span className="anatomy-sheet-title">
                {t(`anatomy.groups.${sheetGroupKey}`)}
              </span>
              <button
                type="button"
                className="anatomy-sheet-close"
                onClick={() => setSheetGroupKey(null)}
                aria-label={t("anatomy.close")}
              >
                ✕
              </button>
            </div>

            <div className="anatomy-sheet-desc">
              {t(`anatomy.groupInfo.${sheetGroupKey}`)}
            </div>

            <div className="anatomy-sheet-muscles">
              {(GROUP_MUSCLES[sheetGroupKey] ?? []).map((m) => (
                <span key={m} className="anatomy-sheet-muscle">{m}</span>
              ))}
            </div>

            {sheetExercises.length > 0 ? (
              <div className="anatomy-sheet-exercises">
                <div className="anatomy-sheet-exercises-title">
                  {sheetExercises.length}{" "}
                  {sheetExercises.length === 1
                    ? t("anatomy.exerciseCount")
                    : t("anatomy.exerciseCountPlural")}
                </div>
                {sheetExercises.map((ex) => (
                  <Link
                    key={ex.slug}
                    href={`/exercices/${ex.slug}`}
                    className="anatomy-sheet-exercise"
                  >
                    <span className="anatomy-sheet-exercise-title">{ex.title}</span>
                    {ex.level ? (
                      <span className="anatomy-sheet-exercise-level">
                        {t(`difficulty.${ex.level}`)}
                      </span>
                    ) : null}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="anatomy-sheet-empty">{t("anatomy.noExercise")}</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
