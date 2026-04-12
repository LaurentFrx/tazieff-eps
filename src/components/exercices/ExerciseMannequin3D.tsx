"use client";

import { useState, useCallback, useMemo, Component } from "react";
import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { getMuscleGroups, MUSCLE_GROUP_COLORS, type MuscleGroupId } from "@/lib/exercices/muscleGroups";

/* ── Dynamic imports (Three.js heavy, SSR incompatible) ─── */

// Lightweight preview: Canvas + HologramMannequin only (no bg, no controls)
const MannequinPreviewCanvas = dynamic(
  () => import("./MannequinPreviewCanvas"),
  { ssr: false },
);


/* ── ErrorBoundary ─── */

class Mannequin3DErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

/* ── Constants ─── */

const POSTERIOR_GROUPS = new Set(["dorsaux", "fessiers", "mollets"]);

/* ── Component ─── */

type Props = {
  muscles: string[];
  slug: string;
  anatomyGroups: string[];
  title?: string;
};

export function ExerciseMannequin3D({ muscles, slug, anatomyGroups }: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const [containerHeight, setContainerHeight] = useState(320);

  const handleFrameComputed = useCallback((h: number) => {
    setContainerHeight(Math.round(h));
  }, []);

  // Orientation — face by default, dos only if majority posterior
  const initialRotationY = useMemo(() => {
    const posteriorCount = anatomyGroups.filter((k) => POSTERIOR_GROUPS.has(k)).length;
    return posteriorCount > anatomyGroups.length / 2 ? Math.PI : 0;
  }, [anatomyGroups]);

  // Preview rotation: slight 3/4 turn from the orientation base
  const previewRotationY = initialRotationY - 0.4;

  // Legend — unified 8-group keys
  const groupKeys = useMemo(() => getMuscleGroups(muscles), [muscles]);

  const anatomyHref = `/apprendre/anatomie?muscles=${anatomyGroups.join(",")}&from=exercice&slug=${slug}`;

  // Tap → navigate to anatomy page
  const handleTap = useCallback(() => {
    router.push(anatomyHref);
  }, [router, anatomyHref]);

  /* ── Legend component (reused in preview + fullscreen) ─── */
  const legend = groupKeys.length > 0 ? (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8 }}>
      {groupKeys.map((key) => (
        <span
          key={key}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 9,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "rgba(255,255,255,0.6)",
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: MUSCLE_GROUP_COLORS[key as MuscleGroupId] ?? "#888", flexShrink: 0 }} />
          {t(`filters.muscleGroups.${key}`)}
        </span>
      ))}
    </div>
  ) : null;

  return (
    <div style={{ position: "relative", width: "100%" }}>
      {/* Legend */}
      <div style={{ marginBottom: 8 }}>{legend}</div>

      {/* 3D Preview canvas — tap navigates to /apprendre/anatomie */}
      <div
        onClick={handleTap}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleTap(); }}
        style={{
          position: "relative",
          borderRadius: 20,
          overflow: "hidden",
          background: "#0a0a14",
          border: "1px solid rgba(255,140,0,0.15)",
          cursor: "pointer",
          width: "100%",
          height: containerHeight,
          transition: "height 0.3s ease",
        }}
      >
        <Mannequin3DErrorBoundary
          fallback={
            <div
              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", color: "rgba(255,255,255,0.4)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}
            >
              {t("exerciseAnatomy.tapToExplore")}
            </div>
          }
        >
          <MannequinPreviewCanvas
            activeGroups={anatomyGroups}
            rotationY={previewRotationY}
            onFrameComputed={handleFrameComputed}
          />
        </Mannequin3DErrorBoundary>
      </div>

      {/* Tap label */}
      <div style={{ textAlign: "center", marginTop: 10, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)" }}>
        {t("exerciseAnatomy.tapToExplore")}
      </div>
    </div>
  );
}
