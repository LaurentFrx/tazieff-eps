"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { ExerciseFrontmatter } from "@/lib/content/schema";
import type { MethodeFrontmatter } from "@/lib/content/schema";
import type { LiveExerciseListItem } from "@/lib/live/types";
import {
  ANATOMY_ZONES,
  getAntagonist,
  getZone,
  getZonesByFace,
  matchesZone,
  type AnatomyFace,
} from "./anatomy-data";
import { MannequinSvg } from "./MannequinSvg";
import "./anatomy.css";

type Props = {
  exercises: LiveExerciseListItem[];
  methodes: MethodeFrontmatter[];
};

/* ─── Canvas particles ────────────────────────────────────────────────── */

function useParticles(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mql.matches) return;

    let animId = 0;
    const particles: { x: number; y: number; vx: number; vy: number; r: number; a: number }[] = [];
    const COUNT = 40;

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
        a: Math.random() * 0.4 + 0.1,
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

/* ─── Main component ──────────────────────────────────────────────────── */

export default function AnatomyMap({ exercises }: Props) {
  const { t, lang } = useI18n();
  const [face, setFace] = useState<AnatomyFace>("anterior");
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useParticles(canvasRef);

  /* ── Zone labels (translated) ───────────────────────────────────────── */
  const zoneLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    for (const z of ANATOMY_ZONES) {
      labels[z.id] = t(`anatomy.zones.${z.id}`);
    }
    return labels;
  }, [t]);

  /* ── Exercises matching selected zone ───────────────────────────────── */
  const matchingExercises = useMemo(() => {
    if (!selected) return [];
    const zone = getZone(selected);
    if (!zone) return [];
    return exercises.filter((ex) =>
      ex.muscles.some((m) => matchesZone(zone, m)),
    );
  }, [selected, exercises]);

  /* ── Antagonist zone ────────────────────────────────────────────────── */
  const antagonistZone = useMemo(() => {
    if (!selected) return null;
    return getAntagonist(selected);
  }, [selected]);

  /* ── Handle zone selection ──────────────────────────────────────────── */
  const handleSelect = useCallback(
    (id: string) => {
      const zone = getZone(id);
      if (!zone) return;

      // If zone is on the other face, flip first
      if (zone.face !== face) {
        setFace(zone.face);
      }
      setSelected((prev) => (prev === id ? null : id));
    },
    [face],
  );

  /* ── Flip toggle ────────────────────────────────────────────────────── */
  const handleFlip = useCallback(() => {
    setFace((f) => (f === "anterior" ? "posterior" : "anterior"));
    setSelected(null);
  }, []);

  /* ── Panel open state (mobile) ──────────────────────────────────────── */
  const panelOpen = selected !== null;

  /* ── Current face zones ─────────────────────────────────────────────── */
  const currentZones = getZonesByFace(face);

  return (
    <div className="anatomy-page">
      {/* Background layers */}
      <div className="anatomy-grid-bg" />
      <canvas ref={canvasRef} className="anatomy-particles" />
      <div className="anatomy-scanline" />

      <div className="anatomy-layout">
        {/* ── Mannequin column ──────────────────────────────────────────── */}
        <div className="anatomy-mannequin">
          {/* HUD header */}
          <div className="anatomy-hud">
            <div className="anatomy-hud-title">
              {t("anatomy.systemTitle")}
            </div>
            <div>
              {face === "anterior"
                ? t("anatomy.anterior")
                : t("anatomy.posterior")}
              {" // "}
              {currentZones.length} {t("anatomy.zones_word")}
            </div>
          </div>

          {/* SVG mannequin with flip */}
          <div className="mannequin-flipper">
            <div
              className={`mannequin-inner${face === "posterior" ? " mannequin-inner--flipped" : ""}`}
            >
              {/* Anterior face */}
              <div className="mannequin-face">
                <MannequinSvg
                  face="anterior"
                  selected={face === "anterior" ? selected : null}
                  antagonist={
                    face === "anterior" ? (antagonistZone?.id ?? null) : null
                  }
                  hovered={face === "anterior" ? hovered : null}
                  onSelect={handleSelect}
                  onHover={setHovered}
                  zoneLabels={zoneLabels}
                />
              </div>
              {/* Posterior face */}
              <div className="mannequin-face mannequin-face--back">
                <MannequinSvg
                  face="posterior"
                  selected={face === "posterior" ? selected : null}
                  antagonist={
                    face === "posterior" ? (antagonistZone?.id ?? null) : null
                  }
                  hovered={face === "posterior" ? hovered : null}
                  onSelect={handleSelect}
                  onHover={setHovered}
                  zoneLabels={zoneLabels}
                />
              </div>
            </div>
          </div>

          {/* Flip button */}
          <button
            type="button"
            className="anatomy-flip-btn"
            onClick={handleFlip}
          >
            <span
              className={`anatomy-flip-icon${face === "posterior" ? " anatomy-flip-icon--flipped" : ""}`}
            >
              ⇄
            </span>
            {t("anatomy.flip")}
          </button>

          {/* HUD status */}
          <div className="anatomy-hud">
            {selected ? t("anatomy.scanActive") : t("anatomy.dataReady")}
          </div>
        </div>

        {/* ── Side panel / Bottom drawer ────────────────────────────────── */}
        <div
          className={`anatomy-panel${panelOpen ? " anatomy-panel--open" : ""}`}
        >
          <div className="anatomy-drawer-handle" />

          {selected ? (
            <SelectedPanel
              zoneId={selected}
              zoneLabel={zoneLabels[selected] ?? selected}
              antagonistZone={antagonistZone}
              antagonistLabel={
                antagonistZone
                  ? (zoneLabels[antagonistZone.id] ?? antagonistZone.id)
                  : null
              }
              exercises={matchingExercises}
              onClose={() => setSelected(null)}
              t={t}
              lang={lang}
            />
          ) : (
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

/* ─── Selected zone panel ─────────────────────────────────────────────── */

function SelectedPanel({
  zoneId,
  zoneLabel,
  antagonistZone,
  antagonistLabel,
  exercises,
  onClose,
  t,
  lang,
}: {
  zoneId: string;
  zoneLabel: string;
  antagonistZone: ReturnType<typeof getAntagonist>;
  antagonistLabel: string | null;
  exercises: LiveExerciseListItem[];
  onClose: () => void;
  t: (key: string) => string;
  lang: string;
}) {
  const zone = getZone(zoneId);
  const regionLabel = zone
    ? t(`anatomy.region.${zone.region}`)
    : "";

  return (
    <>
      <div className="anatomy-panel-header">
        <div>
          <div className="anatomy-panel-title">{zoneLabel}</div>
          <div className="anatomy-hud" style={{ marginTop: 4 }}>
            {regionLabel}
          </div>
        </div>
        <button
          type="button"
          className="anatomy-panel-close"
          onClick={onClose}
        >
          {t("anatomy.closePanel")}
        </button>
      </div>

      {/* Antagonist */}
      {antagonistZone && antagonistLabel ? (
        <div className="anatomy-antagonist">
          <span className="anatomy-antagonist-label">
            {t("anatomy.pair")}
          </span>
          <span className="anatomy-antagonist-name">{antagonistLabel}</span>
        </div>
      ) : null}

      {/* Exercise count */}
      <div className="anatomy-count" style={{ marginBottom: 12 }}>
        <span className="anatomy-count-number">{exercises.length}</span>{" "}
        {exercises.length === 1
          ? t("anatomy.exerciseCount")
          : t("anatomy.exerciseCountPlural")}
      </div>

      {/* Exercise list */}
      {exercises.length > 0 ? (
        <div className="anatomy-exercise-list">
          {exercises.map((ex) => (
            <Link
              key={ex.slug}
              href={`/exercices/${ex.slug}`}
              className="anatomy-exercise-item"
            >
              <span className="anatomy-exercise-title">{ex.title}</span>
              {ex.level ? (
                <span className="anatomy-exercise-level">
                  {t(`difficulty.${ex.level}`)}
                </span>
              ) : null}
            </Link>
          ))}
        </div>
      ) : (
        <div className="anatomy-empty">{t("anatomy.noExercise")}</div>
      )}
    </>
  );
}
