"use client";

import { useState, useCallback, useEffect, Component } from "react";
import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { LocaleLink as Link } from "@/components/LocaleLink";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { MUSCLE_GROUPS } from "@/app/[locale]/apprendre/anatomie/anatomy-data";

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

export function ExerciseMannequin3D({ muscles, slug, anatomyGroups }: Props) {
  const { t } = useI18n();
  const [show3D, setShow3D] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetGroup, setSheetGroup] = useState<string | null>(null);

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
        {/* "Tap to explore" overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.25)" }}
        >
          <span
            className="text-white text-xs uppercase tracking-widest font-semibold px-4 py-2 rounded-full"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          >
            {t("exerciseAnatomy.tapToExplore")}
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
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
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-white/20 border-t-[#FF8C00] rounded-full animate-spin" />
            </div>
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
