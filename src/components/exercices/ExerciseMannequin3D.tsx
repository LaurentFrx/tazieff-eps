"use client";

import { useState, useCallback, useEffect, useMemo, Component } from "react";
import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { LocaleLink as Link } from "@/components/LocaleLink";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { MUSCLE_GROUPS, POSTERIOR_GROUPS } from "@/app/[locale]/apprendre/anatomie/anatomy-data";
import { getExerciseMuscleGroups } from "@/lib/exercices/muscle-groups";

// Dynamic import of the heavy 3D canvas (Three.js ~500KB)
const AnatomyCanvas = dynamic(
  () =>
    import("@/app/[locale]/apprendre/anatomie/AnatomyCanvas").then(
      (m) => m.default,
    ),
  { ssr: false },
);

// ErrorBoundary for 3D rendering failures
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

type Props = {
  muscles: string[];
  slug: string;
  anatomyGroups: string[];
};

const GROUP_COLORS: Record<string, string> = {
  dos: "#3b82f6",
  "membres-inferieurs": "#22c55e",
  "membres-superieurs": "#f97316",
  abdominaux: "#a855f7",
  pectoraux: "#ef4444",
};

export function ExerciseMannequin3D({ muscles, slug, anatomyGroups }: Props) {
  const { t } = useI18n();
  const [show3D, setShow3D] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetGroup, setSheetGroup] = useState<string | null>(null);

  // B2: Orientation — face by default, dos only if majority posterior
  const initialRotationY = useMemo(() => {
    const posteriorCount = anatomyGroups.filter((k) => POSTERIOR_GROUPS.has(k)).length;
    return posteriorCount > anatomyGroups.length / 2 ? Math.PI : 0;
  }, [anatomyGroups]);

  // B3: Legend — simplified muscle group keys
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

  // Mark loading done after a short delay (AnatomyCanvas has no onReady callback)
  useEffect(() => {
    if (!show3D) return;
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, [show3D]);

  const anatomyHref = `/apprendre/anatomie?muscles=${anatomyGroups.join(",")}&from=exercice&slug=${slug}`;

  // Find sub-muscles for the selected group
  const groupData = sheetGroup ? MUSCLE_GROUPS[sheetGroup] : null;
  const groupLabel = groupData
    ? sheetGroup!.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "";

  if (!show3D) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: "100%" }}>
        {/* B3: Legend labels */}
        {groupKeys.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, marginBottom: 4 }}>
            {groupKeys.map((key) => (
              <span key={key} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 8, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.6)" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: GROUP_COLORS[key] ?? "#888" }} />
                {t(`filters.muscleGroups.${key}`)}
              </span>
            ))}
          </div>
        )}
        <div
          className="relative cursor-pointer"
          style={{ width: "100%", height: 320 }}
          onClick={() => setShow3D(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setShow3D(true);
          }}
        >
          <img
            src="/images/anatomy/mini-mannequin.webp"
            alt={t("exerciseAnatomy.musclesWorked")}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain",
              objectPosition: "center 10%",
              pointerEvents: "none",
            }}
            loading="lazy"
          />
        </div>
        {/* B1: Tap text below image, not as overlay */}
        <div style={{ marginTop: 8, textAlign: "center", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.35, color: "white" }}>
          {t("exerciseAnatomy.tapToExplore")}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* B3: Legend labels (3D active) */}
      {groupKeys.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, marginBottom: 4 }}>
          {groupKeys.map((key) => (
            <span key={key} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 8, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.6)" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: GROUP_COLORS[key] ?? "#888" }} />
              {t(`filters.muscleGroups.${key}`)}
            </span>
          ))}
        </div>
      )}
      <Mannequin3DErrorBoundary
        fallback={
          <Link
            href={anatomyHref}
            style={{ display: "block", width: "100%", height: 320 }}
          >
            <img
              src="/images/anatomy/mini-mannequin.webp"
              alt={t("exerciseAnatomy.musclesWorked")}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </Link>
        }
      >
        <div
          style={{
            width: "100%",
            height: 320,
            touchAction: "pan-y",
            position: "relative",
          }}
        >
          {loading && (
            <div className="absolute inset-0 skeleton" />
          )}
          <div
            style={{ opacity: loading ? 0 : 1, transition: "opacity 0.5s ease", width: "100%", height: "100%" }}
          >
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
