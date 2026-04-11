"use client";

import { useState, useCallback, useEffect, useMemo, Component } from "react";
import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { LocaleLink as Link } from "@/components/LocaleLink";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { MUSCLE_GROUPS, POSTERIOR_GROUPS } from "@/app/[locale]/apprendre/anatomie/anatomy-data";
import { getExerciseMuscleGroups } from "@/lib/exercices/muscle-groups";

/* ── Dynamic imports (Three.js heavy, SSR incompatible) ─── */

// Lightweight preview: Canvas + HologramMannequin only (no bg, no controls)
const MannequinPreviewCanvas = dynamic(
  () => import("./MannequinPreviewCanvas"),
  { ssr: false },
);

// Full AnatomyCanvas for fullscreen mode
const AnatomyCanvas = dynamic(
  () =>
    import("@/app/[locale]/apprendre/anatomie/AnatomyCanvas").then(
      (m) => m.default,
    ),
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
  componentDidCatch(error: Error) {
    console.error("[MannequinPreview] render error:", error);
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

/* ── Constants ─── */

const GROUP_COLORS: Record<string, string> = {
  dos: "#3b82f6",
  "membres-inferieurs": "#22c55e",
  "membres-superieurs": "#f97316",
  abdominaux: "#a855f7",
  pectoraux: "#ef4444",
};

/* ── Component ─── */

type Props = {
  muscles: string[];
  slug: string;
  anatomyGroups: string[];
  title?: string;
};

export function ExerciseMannequin3D({ muscles, slug, anatomyGroups, title }: Props) {
  const { t } = useI18n();
  const [fullscreen, setFullscreen] = useState(false);
  const [fsLoading, setFsLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetGroup, setSheetGroup] = useState<string | null>(null);
  const [animateIn, setAnimateIn] = useState(false);
  const [containerHeight, setContainerHeight] = useState(350);
  const [canvasLoaded, setCanvasLoaded] = useState(false);

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

  // Legend — simplified muscle group keys
  const groupKeys = useMemo(() => getExerciseMuscleGroups(muscles), [muscles]);

  const handleClickMuscle = useCallback(
    (_frName: string | null, groupKey: string | null) => {
      if (groupKey) {
        setSheetGroup(groupKey);
        setSheetOpen(true);
      }
    },
    [],
  );

  const noop = useCallback(() => {}, []);

  // Fullscreen loading timer
  useEffect(() => {
    if (!fullscreen) return;
    setFsLoading(true);
    const timer = setTimeout(() => setFsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, [fullscreen]);

  // Animate in
  useEffect(() => {
    if (fullscreen) {
      requestAnimationFrame(() => setAnimateIn(true));
    } else {
      setAnimateIn(false);
    }
  }, [fullscreen]);

  // Lock body scroll when fullscreen
  useEffect(() => {
    if (fullscreen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [fullscreen]);

  const handleOpen = useCallback(() => setFullscreen(true), []);
  const handleClose = useCallback(() => {
    setAnimateIn(false);
    setTimeout(() => {
      setFullscreen(false);
      // Dispose preview canvas WebGL context when closing fullscreen
      setCanvasLoaded(false);
    }, 250);
  }, []);

  const anatomyHref = `/apprendre/anatomie?muscles=${anatomyGroups.join(",")}&from=exercice&slug=${slug}`;

  const groupData = sheetGroup ? MUSCLE_GROUPS[sheetGroup] : null;
  const groupLabel = groupData
    ? sheetGroup!.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "";

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
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: GROUP_COLORS[key] ?? "#888", flexShrink: 0 }} />
          {t(`filters.muscleGroups.${key}`)}
        </span>
      ))}
    </div>
  ) : null;

  return (
    <>
      {/* ─── MINIATURE PREVIEW ─── */}
      <div style={{ position: "relative", width: "100%" }}>
        {/* Legend */}
        <div style={{ marginBottom: 8 }}>{legend}</div>

        {/* Preview container — static placeholder until tap, then 3D canvas */}
        <div
          onClick={() => { if (!canvasLoaded) { setCanvasLoaded(true); } else { handleOpen(); } }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { if (!canvasLoaded) setCanvasLoaded(true); else handleOpen(); } }}
          style={{
            position: "relative",
            borderRadius: 20,
            overflow: "hidden",
            background: "#0a0a14",
            border: "1px solid rgba(255,140,0,0.15)",
            cursor: "pointer",
            width: "100%",
            minHeight: 280,
            height: canvasLoaded ? containerHeight : 280,
            transition: "height 0.3s ease",
          }}
        >
          {canvasLoaded ? (
            <Mannequin3DErrorBoundary
              fallback={
                <Link
                  href={anatomyHref}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", gap: 8, color: "rgba(255,255,255,0.5)", fontSize: 12, textDecoration: "none" }}
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <span>3D non disponible</span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Voir l&apos;anatomie →</span>
                </Link>
              }
            >
              <MannequinPreviewCanvas
                activeGroups={anatomyGroups}
                rotationY={previewRotationY}
                onFrameComputed={handleFrameComputed}
              />
            </Mannequin3DErrorBoundary>
          ) : (
            /* Static placeholder — zero WebGL context */
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", gap: 8 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/anatomy/mini-mannequin.webp" alt="" style={{ height: 160, opacity: 0.35, pointerEvents: "none", filter: "grayscale(1)" }} />
              <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-bebas), sans-serif" }}>
                {t("exerciseAnatomy.tapToExplore")}
              </span>
            </div>
          )}
        </div>

        {/* Tap label (only when canvas is loaded) */}
        {canvasLoaded && (
          <div style={{ textAlign: "center", marginTop: 10, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)" }}>
            {t("exerciseAnatomy.tapToExplore")}
          </div>
        )}
      </div>

      {/* ─── FULLSCREEN OVERLAY ─── */}
      {fullscreen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            background: "#04040A",
            transform: animateIn ? "scale(1)" : "scale(0.92)",
            opacity: animateIn ? 1 : 0,
            transition: "transform 0.35s cubic-bezier(0.22,1,0.36,1), opacity 0.25s ease",
          }}
        >
          {/* Header */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 210,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "calc(16px + env(safe-area-inset-top, 0px)) 16px 12px",
              background: "linear-gradient(to bottom, rgba(4,4,10,0.85) 0%, transparent 100%)",
              pointerEvents: "none",
            }}
          >
            <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.5)", pointerEvents: "none" }}>
              {title ?? slug.toUpperCase()}
            </span>
            <button
              type="button"
              onClick={handleClose}
              style={{
                pointerEvents: "auto",
                width: 40,
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(10,10,20,0.65)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 10,
                color: "rgba(255,255,255,0.75)",
                fontSize: 18,
                cursor: "pointer",
              }}
              aria-label={t("header.close")}
            >
              ✕
            </button>
          </div>

          {/* Full 3D Canvas */}
          <Mannequin3DErrorBoundary
            fallback={
              <Link
                href={anatomyHref}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", gap: 12, color: "rgba(255,255,255,0.5)", fontSize: 14, textDecoration: "none" }}
                onClick={handleClose}
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>3D non disponible sur cet appareil</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Voir l&apos;anatomie en ligne →</span>
              </Link>
            }
          >
            <div style={{ position: "absolute", inset: 0, touchAction: "none" }}>
              {fsLoading && <div className="absolute inset-0 skeleton" />}
              <div style={{ opacity: fsLoading ? 0 : 1, transition: "opacity 0.5s ease", width: "100%", height: "100%" }}>
                <AnatomyCanvas
                  selectedGroup={null}
                  highlightedMuscle={null}
                  activeGroups={anatomyGroups}
                  scanning={false}
                  showSkeleton={false}
                  showWireframe={true}
                  showMuscles={true}
                  onHoverMuscle={noop}
                  onClickMuscle={handleClickMuscle}
                  onLongPressMuscle={noop}
                  initialRotationY={initialRotationY}
                />
              </div>
            </div>
          </Mannequin3DErrorBoundary>

          {/* Bottom legend */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 210,
              padding: "16px 16px calc(16px + env(safe-area-inset-bottom, 0px))",
              background: "linear-gradient(to top, rgba(4,4,10,0.85) 0%, transparent 100%)",
              pointerEvents: "none",
            }}
          >
            {legend}
          </div>
        </div>
      )}

      {/* Bottom sheet for muscle group details */}
      <BottomSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={groupLabel}
      >
        <div className="flex flex-col gap-3 pb-4">
          {groupData && (
            <p className="text-sm text-white/60">
              {groupData.keywords.slice(0, 5).join(" · ")}
            </p>
          )}
          <Link
            href={`/exercices?muscle=${sheetGroup}`}
            className="tap-feedback flex items-center justify-center py-3 rounded-xl bg-[#FF8C00] text-white text-sm font-semibold"
            onClick={() => setSheetOpen(false)}
          >
            {t("exerciseAnatomy.seeExercises")}
          </Link>
          <Link
            href={anatomyHref}
            className="tap-feedback flex items-center justify-center py-3 rounded-xl bg-white/10 text-white text-sm font-medium"
            onClick={() => setSheetOpen(false)}
          >
            {t("exerciseAnatomy.tapToExplore")}
          </Link>
        </div>
      </BottomSheet>
    </>
  );
}
