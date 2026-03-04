"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { LiveExerciseListItem } from "@/lib/live/types";
import { MUSCLE_GROUPS, matchesGroup } from "./anatomy-data";
import "./anatomy.css";

const AnatomyCanvas = dynamic(() => import("./AnatomyCanvas"), {
  ssr: false,
  loading: () => <div className="anatomy-loading">Initializing 3D…</div>,
});

type Props = {
  exercises: LiveExerciseListItem[];
};

/* ─── Group list item (unique muscles from the model) ────────────────── */

const GROUP_MUSCLES: Record<string, string[]> = {
  dorsaux: ["Grand dorsal", "Trapèzes", "Rhomboïdes"],
  pectoraux: ["Grand pectoral"],
  abdominaux: ["Grand droit", "Obliques", "Transverse"],
  deltoides: ["Deltoïde antérieur", "Deltoïde moyen", "Deltoïde postérieur"],
  biceps: ["Biceps brachial", "Brachial"],
  triceps: ["Triceps brachial"],
  flechisseurs: ["Psoas-iliaque"],
  fessiers: ["Grand fessier", "Moyen fessier"],
  quadriceps: ["Droit fémoral", "Vastes"],
  ischio_jambiers: ["Biceps fémoral", "Semi-tendineux", "Semi-membraneux"],
  mollets: ["Gastrocnémiens", "Soléaire"],
};

/* ─── Main component ──────────────────────────────────────────────────── */

export default function AnatomyMap({ exercises }: Props) {
  const { t } = useI18n();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [highlightedMuscle, setHighlightedMuscle] = useState<string | null>(
    null,
  );
  const [tooltip, setTooltip] = useState<{
    name: string;
    group: string | null;
  } | null>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  /* ── Exercises matching selected group ────────────────────────────────── */
  const matchingExercises = useMemo(() => {
    if (!selectedGroup) return [];
    const group = MUSCLE_GROUPS[selectedGroup];
    if (!group) return [];
    return exercises.filter((ex) =>
      ex.muscles.some((m) => matchesGroup(group, m)),
    );
  }, [selectedGroup, exercises]);

  /* ── Handle group selection (from panel click) ───────────────────────── */
  const handleGroupToggle = useCallback((groupId: string) => {
    setSelectedGroup((prev) => {
      if (prev === groupId) {
        setHighlightedMuscle(null);
        return null;
      }
      setHighlightedMuscle(null);
      return groupId;
    });
  }, []);

  /* ── Handle muscle highlight (from panel click) ──────────────────────── */
  const handleMuscleHighlight = useCallback((muscleName: string) => {
    setHighlightedMuscle((prev) =>
      prev === muscleName ? null : muscleName,
    );
  }, []);

  /* ── Handle 3D click ─────────────────────────────────────────────────── */
  const handleClickMuscle = useCallback(
    (frName: string, groupKey: string) => {
      if (selectedGroup === groupKey) {
        setHighlightedMuscle((prev) => (prev === frName ? null : frName));
      } else {
        setSelectedGroup(groupKey);
        setHighlightedMuscle(null);
      }
    },
    [selectedGroup],
  );

  /* ── Handle 3D hover ─────────────────────────────────────────────────── */
  const handleHoverMuscle = useCallback(
    (frName: string | null, groupKey: string | null) => {
      if (frName) {
        setTooltip({
          name: frName,
          group: groupKey ? MUSCLE_GROUPS[groupKey]?.id : null,
        });
      } else {
        setTooltip(null);
      }
    },
    [],
  );

  const panelOpen = selectedGroup !== null;

  return (
    <div className="anatomy-page">
      {/* Background (parallax-synced with camera) */}
      <div ref={bgRef} className="anatomy-bg" />

      <div className="anatomy-layout">
        {/* ── 3D Canvas (full viewport) ──────────────────────────────── */}
        <div className="anatomy-canvas-wrap">
          <AnatomyCanvas
            selectedGroup={selectedGroup}
            highlightedMuscle={highlightedMuscle}
            onHoverMuscle={handleHoverMuscle}
            onClickMuscle={handleClickMuscle}
            bgRef={bgRef}
          />

          {/* HUD overlay (minimal — no redundant title) */}
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

          {/* Tooltip (follows 3D hover) */}
          {tooltip && (
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

        {/* ── Floating side panel ────────────────────────────────────── */}
        <div
          className={`anatomy-panel${panelOpen ? " anatomy-panel--open" : ""}`}
        >
          <div className="anatomy-drawer-handle" />

          {/* Muscle groups accordion */}
          <div className="anatomy-groups">
            {Object.entries(MUSCLE_GROUPS).map(([key, group]) => {
              const isOpen = selectedGroup === key;
              const muscles = GROUP_MUSCLES[key] ?? [];
              return (
                <div
                  key={key}
                  className={`anatomy-group${isOpen ? " anatomy-group--open" : ""}`}
                >
                  <button
                    type="button"
                    className="anatomy-group-header"
                    onClick={() => handleGroupToggle(key)}
                  >
                    <span
                      className="anatomy-group-dot"
                      style={{ background: group.color }}
                    />
                    <span className="anatomy-group-name">
                      {t(`anatomy.groups.${key}`)}
                    </span>
                    <span className="anatomy-group-count">
                      {muscles.length}
                    </span>
                    <span className="anatomy-group-chevron">
                      {isOpen ? "▼" : "▶"}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="anatomy-group-muscles">
                      {muscles.map((m) => (
                        <button
                          key={m}
                          type="button"
                          className={`anatomy-muscle-item${highlightedMuscle === m ? " highlighted" : ""}`}
                          onClick={() => handleMuscleHighlight(m)}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Info panel when group selected */}
          {selectedGroup && (
            <div className="anatomy-info-panel">
              <div className="anatomy-info-header">
                <span
                  className="anatomy-group-dot"
                  style={{
                    background: MUSCLE_GROUPS[selectedGroup].color,
                  }}
                />
                <span className="anatomy-info-title">
                  {t(`anatomy.groups.${selectedGroup}`)}
                </span>
              </div>
              <div className="anatomy-info-desc">
                {t(`anatomy.groupInfo.${selectedGroup}`)}
              </div>

              {/* Matching exercises */}
              <div className="anatomy-count">
                <span className="anatomy-count-number">
                  {matchingExercises.length}
                </span>{" "}
                {matchingExercises.length === 1
                  ? t("anatomy.exerciseCount")
                  : t("anatomy.exerciseCountPlural")}
              </div>

              {matchingExercises.length > 0 ? (
                <div className="anatomy-exercise-list">
                  {matchingExercises.map((ex) => (
                    <Link
                      key={ex.slug}
                      href={`/exercices/${ex.slug}`}
                      className="anatomy-exercise-item"
                    >
                      <span className="anatomy-exercise-title">
                        {ex.title}
                      </span>
                      {ex.level ? (
                        <span className="anatomy-exercise-level">
                          {t(`difficulty.${ex.level}`)}
                        </span>
                      ) : null}
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="anatomy-empty">
                  {t("anatomy.noExercise")}
                </div>
              )}
            </div>
          )}

          {!selectedGroup && (
            <div className="anatomy-placeholder">
              <div className="anatomy-placeholder-icon">⬡</div>
              <div className="anatomy-placeholder-text">
                {t("anatomy.selectZone")}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile group chips */}
      <div className="anatomy-chips-bar">
        {Object.entries(MUSCLE_GROUPS).map(([key, group]) => (
          <button
            key={key}
            type="button"
            className={`anatomy-chip${selectedGroup === key ? " anatomy-chip--active" : ""}`}
            onClick={() => handleGroupToggle(key)}
          >
            <span
              className="anatomy-chip-dot"
              style={{ background: group.color }}
            />
            {t(`anatomy.groups.${key}`)}
          </button>
        ))}
      </div>
    </div>
  );
}
