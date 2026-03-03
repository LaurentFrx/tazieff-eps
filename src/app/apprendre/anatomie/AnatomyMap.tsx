"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Menu, X } from "lucide-react";
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

/* ─── Canvas particles (HTML overlay) ─────────────────────────────────── */

function useParticles(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mql.matches) return;

    let animId = 0;
    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      a: number;
    }[] = [];
    const COUNT = 35;

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth * devicePixelRatio;
      canvas.height = canvas.offsetHeight * devicePixelRatio;
    }

    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5,
        a: Math.random() * 0.35 + 0.05,
      });
    }

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * devicePixelRatio, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 212, 255, ${p.a})`;
        ctx.fill();
      }
      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [canvasRef]);
}

/* ─── Group list item (unique muscles from the model) ────────────────── */

const GROUP_MUSCLES: Record<string, string[]> = {
  dos: [
    "Grand dorsal",
    "Grand rhomboïde",
    "Petit rhomboïde",
    "Trapèze ascendant",
    "Trapèze descendant",
    "Trapèze transverse",
    "Ilio-costal des lombes",
    "Ilio-costal du thorax",
    "Ilio-costal du cou",
    "Longissimus du thorax",
    "Longissimus de la tête",
    "Longissimus du cou",
    "Épineux de la tête",
    "Épineux du cou",
    "Épineux du thorax",
  ],
  pectoraux: [
    "Pectoral (claviculaire)",
    "Pectoral (sterno-costal)",
    "Pectoral (abdominal)",
    "Petit pectoral",
    "Dentelé antérieur",
  ],
  abdominaux: [
    "Grand droit abdomen",
    "Oblique externe",
    "Oblique interne",
    "Transverse abdomen",
  ],
  epaules: [
    "Deltoïde antérieur",
    "Deltoïde moyen",
    "Deltoïde postérieur",
    "Grand rond",
    "Infra-épineux",
    "Supra-épineux",
  ],
  bras: [
    "Biceps (long chef)",
    "Biceps (court chef)",
    "Brachial",
    "Brachio-radial",
    "Coraco-brachial",
    "Triceps (long chef)",
    "Triceps (latéral)",
    "Triceps (médial)",
  ],
  psoas: ["Psoas", "Iliaque"],
  fessiers: ["Grand fessier", "Moyen fessier", "Petit fessier"],
  cuisses: [
    "Droit fémoral",
    "Vaste latéral",
    "Vaste médial",
    "Vaste intermédiaire",
    "Couturier",
    "Grand adducteur",
    "Long adducteur",
    "Court adducteur",
    "Gracile",
    "Semi-membraneux",
    "Semi-tendineux",
  ],
  mollets: ["Gastrocnémien latéral", "Gastrocnémien médial", "Soléaire"],
};

/* ─── Main component ──────────────────────────────────────────────────── */

export default function AnatomyMap({ exercises }: Props) {
  const { t } = useI18n();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [highlightedMuscle, setHighlightedMuscle] = useState<string | null>(
    null,
  );
  const [wireframe, setWireframe] = useState(false);
  const [silhouetteOpacity, setSilhouetteOpacity] = useState(0.4);
  const [tooltip, setTooltip] = useState<{
    name: string;
    group: string | null;
  } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useParticles(canvasRef);

  /* ── Close menu on click outside or Escape ───────────────────────────── */
  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

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

  /* ── Reset all ───────────────────────────────────────────────────────── */
  const handleReset = useCallback(() => {
    setSelectedGroup(null);
    setHighlightedMuscle(null);
    setWireframe(false);
    setSilhouetteOpacity(0.4);
  }, []);

  const panelOpen = selectedGroup !== null;

  return (
    <div className="anatomy-page">
      {/* Background layers */}
      <div className="anatomy-grid-bg" />
      <canvas ref={canvasRef} className="anatomy-particles" />
      <div className="anatomy-scanline" />

      {/* ── Floating hamburger menu ──────────────────────────────────── */}
      <div className="anatomy-menu-wrap" ref={menuRef}>
        <button
          type="button"
          className="anatomy-menu-btn"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? t("anatomy.closeMenu") : t("anatomy.openMenu")}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {menuOpen && (
          <nav className="anatomy-menu-dropdown" aria-label="Navigation">
            <Link href="/exercices" className="anatomy-menu-item">
              {t("nav.exos.label")}
            </Link>
            <Link href="/seances" className="anatomy-menu-item">
              {t("nav.seances.label")}
            </Link>
            <Link href="/methodes" className="anatomy-menu-item">
              {t("nav.methodes.label")}
            </Link>
            <Link href="/apprendre" className="anatomy-menu-item">
              {t("nav.apprendre.label")}
            </Link>
            <Link href="/bac" className="anatomy-menu-item">
              {t("nav.bac.label")}
            </Link>
            <Link href="/ma-seance" className="anatomy-menu-item">
              {t("nav.maSeance.label")}
            </Link>
            <div className="anatomy-menu-divider" />
            <Link href="/reglages" className="anatomy-menu-item">
              {t("pages.settings.title")}
            </Link>
          </nav>
        )}
      </div>

      <div className="anatomy-layout">
        {/* ── 3D Canvas (full viewport) ──────────────────────────────── */}
        <div className="anatomy-canvas-wrap">
          <AnatomyCanvas
            selectedGroup={selectedGroup}
            highlightedMuscle={highlightedMuscle}
            wireframe={wireframe}
            silhouetteOpacity={silhouetteOpacity}
            onHoverMuscle={handleHoverMuscle}
            onClickMuscle={handleClickMuscle}
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
                  : `9 ${t("anatomy.groups_word")}`}
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

          {/* Controls bar */}
          <div className="anatomy-controls">
            <label className="anatomy-control-slider">
              <span>{t("anatomy.opacity")}</span>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(silhouetteOpacity * 100)}
                onChange={(e) =>
                  setSilhouetteOpacity(Number(e.target.value) / 100)
                }
              />
            </label>
            <button
              type="button"
              className={`anatomy-control-btn${wireframe ? " active" : ""}`}
              onClick={() => setWireframe((v) => !v)}
            >
              {t("anatomy.wireframe")}
            </button>
            <button
              type="button"
              className="anatomy-control-btn"
              onClick={handleReset}
            >
              {t("anatomy.reset")}
            </button>
          </div>

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
    </div>
  );
}
