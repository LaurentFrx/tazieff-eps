"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html, useGLTF } from "@react-three/drei";
import { useGesture } from "@use-gesture/react";
import * as THREE from "three";
import { useI18n } from "@/lib/i18n/I18nProvider";
import {
  MUSCLE_GROUPS,
  GROUP_MUSCLES,
  GROUP_ANCHORS,
  getGroupForNode,
  getFrenchName,
  getSide,
} from "@/app/apprendre/anatomie/anatomy-data";

/* Draco decoder — idempotent */
useGLTF.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");

type Props = {
  muscles: string[];
  groupKeys: string[];
  onClose: () => void;
};

/* eslint-disable @typescript-eslint/no-explicit-any -- drei OrbitControls ref */
type OrbitControlsRef = React.RefObject<any>;
/* eslint-enable @typescript-eslint/no-explicit-any */

/* ── Constants ─────────────────────────────────────────────────────────── */

const FEET_Y = -1.28;
const MANNEQUIN_SCALE = 1.5;
const TARGET_Y = FEET_Y + 1.5;
const MIN_ZOOM = 1.0;
const MAX_ZOOM = 2.5;

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

/* ── Interactive mannequin for modal ───────────────────────────────────── */

function ModalMannequin({
  activeGroups,
  highlightedMuscle,
}: {
  activeGroups: Set<string>;
  highlightedMuscle: string | null;
}) {
  const { scene: musclesOrig } = useGLTF("/models/muscles.glb");
  const { scene: silhouetteOrig } = useGLTF("/models/silhouette.glb");

  const musclesScene = useMemo(() => musclesOrig.clone(true), [musclesOrig]);
  const silhouetteScene = useMemo(
    () => silhouetteOrig.clone(true),
    [silhouetteOrig],
  );

  /* Track meshes for material updates */
  const meshesRef = useRef<
    { mesh: THREE.Mesh; groupKey: string | null; baseFrName: string }[]
  >([]);

  /* Initial material setup */
  useEffect(() => {
    const entries: typeof meshesRef.current = [];
    musclesScene.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      const rawName = mesh.name || mesh.parent?.name || "unknown";
      const groupKey = getGroupForNode(rawName);
      const frName = getFrenchName(rawName);
      const side = getSide(rawName);
      const baseFrName = frName;
      const _displayName = side ? `${frName} (${side})` : frName;

      const color = new THREE.Color(
        groupKey ? MUSCLE_GROUPS[groupKey].color : 0x888888,
      );
      mesh.material = new THREE.MeshPhongMaterial({
        color,
        emissive: new THREE.Color(0x000000),
        shininess: 30,
        side: THREE.DoubleSide,
      });
      mesh.renderOrder = 1;
      entries.push({ mesh, groupKey, baseFrName });
    });
    meshesRef.current = entries;

    silhouetteScene.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      (child as THREE.Mesh).material = new THREE.MeshBasicMaterial({
        color: 0x555555,
        transparent: true,
        opacity: 0.12,
        wireframe: true,
        side: THREE.BackSide,
        depthWrite: false,
        depthTest: false,
      });
      (child as THREE.Mesh).renderOrder = -2;
    });
  }, [musclesScene, silhouetteScene]);

  /* Track highlighted name for useFrame pulse */
  const highlightedRef = useRef<string | null>(null);
  highlightedRef.current = highlightedMuscle;

  /* Update materials when selection changes — NEVER reduce opacity */
  useEffect(() => {
    for (const { mesh, groupKey, baseFrName } of meshesRef.current) {
      const mat = mesh.material as THREE.MeshPhongMaterial;
      const ud = mesh.userData as { originalColor?: THREE.Color };
      if (!ud.originalColor) {
        ud.originalColor = new THREE.Color(
          groupKey ? MUSCLE_GROUPS[groupKey].color : 0x888888,
        );
      }

      if (highlightedMuscle && baseFrName === highlightedMuscle) {
        /* Selected sub-muscle: full opacity + strong emissive (pulse in useFrame) */
        mat.color.copy(ud.originalColor);
        mat.opacity = 1;
        mat.transparent = false;
        mat.emissive.copy(ud.originalColor).multiplyScalar(0.8);
      } else if (groupKey && activeGroups.has(groupKey)) {
        /* Active group muscle: vivid with moderate emissive glow */
        mat.color.copy(ud.originalColor);
        mat.opacity = 0.9;
        mat.transparent = true;
        mat.emissive.copy(ud.originalColor).multiplyScalar(0.3);
      } else {
        /* Non-active muscle: nearly invisible gray */
        mat.color.set(0x2a2a2a);
        mat.opacity = 0.15;
        mat.transparent = true;
        mat.emissive.set(0x000000);
      }
    }
  }, [activeGroups, highlightedMuscle]);

  /* Pulse animation on highlighted sub-muscle */
  useFrame(({ clock }) => {
    if (!highlightedRef.current) return;
    const t = clock.getElapsedTime();
    const pulse = 0.6 + 0.4 * Math.sin(t * 3);
    for (const { mesh, baseFrName } of meshesRef.current) {
      if (baseFrName !== highlightedRef.current) continue;
      const ud = mesh.userData as { originalColor?: THREE.Color };
      if (!ud.originalColor) continue;
      const mat = mesh.material as THREE.MeshPhongMaterial;
      mat.emissive.copy(ud.originalColor).multiplyScalar(pulse);
    }
  });

  return (
    <group>
      <ambientLight intensity={0.8} color={0xffeedd} />
      <directionalLight position={[-3, 4, 1]} intensity={1.2} color={0xfff5e0} />
      <directionalLight position={[-2, 1, -1]} intensity={0.5} color={0x88aaff} />
      <directionalLight position={[0, 2, -3]} intensity={0.3} />
      <primitive object={silhouetteScene} />
      <primitive object={musclesScene} />
    </group>
  );
}

/* ── Floating 3D labels ────────────────────────────────────────────────── */

function ModalLabels({
  groupKeys,
  onSelectGroup,
}: {
  groupKeys: string[];
  onSelectGroup: (key: string) => void;
}) {
  const { t } = useI18n();

  return (
    <>
      {groupKeys.map((key) => {
        const anchor = GROUP_ANCHORS[key];
        if (!anchor) return null;
        const group = MUSCLE_GROUPS[key];
        const subCount = GROUP_MUSCLES[key]?.length ?? 0;

        return (
          <Html
            key={key}
            position={anchor}
            center
            zIndexRange={[10, 0]}
            style={{ pointerEvents: "none" }}
          >
            <button
              type="button"
              className="exo-anatomy-modal-label"
              onClick={() => onSelectGroup(key)}
            >
              <span
                className="exo-anatomy-modal-label-dot"
                style={{ background: group.color }}
              />
              <span className="exo-anatomy-modal-label-name">
                {t(`anatomy.groups.${key}`)}
              </span>
              {subCount > 1 && (
                <span className="exo-anatomy-modal-label-count">
                  {subCount}
                </span>
              )}
            </button>
          </Html>
        );
      })}
    </>
  );
}

/* ── Zoomable scene with OrbitControls ──────────────────────────────────── */

function ModalScene({
  groupKeys,
  highlightedMuscle,
  onSelectGroup,
}: {
  groupKeys: string[];
  highlightedMuscle: string | null;
  onSelectGroup: (key: string) => void;
}) {
  const scaleRef = useRef<THREE.Group>(null);
  const orbitRef: OrbitControlsRef = useRef(null);
  const zoomRef = useRef(1);
  const panRef = useRef(new THREE.Vector3(0, 0, 0));
  const defaultTarget = useMemo(() => new THREE.Vector3(0, TARGET_Y, 0), []);
  const lerpVec = useRef(new THREE.Vector3());
  const zeroVec = useRef(new THREE.Vector3(0, 0, 0));
  const raycasterObj = useRef(new THREE.Raycaster());
  const ndcVec = useRef(new THREE.Vector2());
  const { gl, camera } = useThree();

  const FOV_RAD = (60 * Math.PI) / 180;

  /** Unproject screen point onto z=0 world plane. */
  const screenToWorld = (sx: number, sy: number) => {
    const el = gl.domElement;
    const rect = el.getBoundingClientRect();
    ndcVec.current.set(
      ((sx - rect.left) / rect.width) * 2 - 1,
      -((sy - rect.top) / rect.height) * 2 + 1,
    );
    raycasterObj.current.setFromCamera(ndcVec.current, camera);
    const ray = raycasterObj.current.ray;
    const t = -ray.origin.z / ray.direction.z;
    return ray.origin.clone().addScaledVector(ray.direction, Math.max(0.001, t));
  };

  const activeGroups = useMemo(() => new Set(groupKeys), [groupKeys]);

  /* Set initial orbit target */
  useEffect(() => {
    if (orbitRef.current) {
      orbitRef.current.target.copy(defaultTarget);
    }
  }, [defaultTarget]);

  /* Prevent browser gesture handling on iOS */
  useEffect(() => {
    gl.domElement.style.touchAction = "none";
  }, [gl]);

  /* Pinch zoom + pan & wheel zoom via @use-gesture (pointer events) */
  useGesture(
    {
      onPinch: ({ da: [dist], origin: [ox, oy], first, memo }) => {
        if (first || !memo) {
          return { prevDist: dist, lastOx: ox, lastOy: oy };
        }

        /* Ratio-based zoom (matches native pinch feel) */
        if (memo.prevDist > 0 && dist > 0) {
          const oldZoom = zoomRef.current;
          const newZoom = clamp(
            oldZoom * (dist / memo.prevDist),
            MIN_ZOOM,
            MAX_ZOOM,
          );
          if (newZoom !== oldZoom) {
            const worldMid = screenToWorld(ox, oy);
            const feetPos = new THREE.Vector3(0, FEET_Y, 0);
            const shift = worldMid
              .sub(feetPos)
              .multiplyScalar(newZoom / oldZoom - 1);
            panRef.current.add(shift);
          }
          zoomRef.current = newZoom;
        }

        /* Pan from finger midpoint movement */
        const rect = gl.domElement.getBoundingClientRect();
        const visibleH = 2 * camera.position.z * Math.tan(FOV_RAD / 2);
        const worldPerPx = visibleH / rect.height;
        panRef.current.x -= (ox - memo.lastOx) * worldPerPx;
        panRef.current.y += (oy - memo.lastOy) * worldPerPx;

        return { prevDist: dist, lastOx: ox, lastOy: oy };
      },
      onWheel: ({ event, delta: [, dy] }) => {
        event.preventDefault();
        const e = event as WheelEvent;
        const oldZoom = zoomRef.current;
        const newZoom = clamp(
          oldZoom * (1 - dy * 0.001),
          MIN_ZOOM,
          MAX_ZOOM,
        );
        if (newZoom === oldZoom) return;

        const worldCursor = screenToWorld(e.clientX, e.clientY);
        const feetPos = new THREE.Vector3(0, FEET_Y, 0);
        const shift = worldCursor
          .sub(feetPos)
          .multiplyScalar(newZoom / oldZoom - 1);
        panRef.current.add(shift);
        zoomRef.current = newZoom;
        if (newZoom <= 1.02) panRef.current.set(0, 0, 0);
      },
    },
    {
      target: gl.domElement,
      eventOptions: { passive: false },
    },
  );

  /* Per-frame sync */
  useFrame(() => {
    const z = zoomRef.current;
    scaleRef.current?.scale.setScalar(z);

    const orbit = orbitRef.current;
    if (orbit) {
      /* Gradually return pan to zero when fully dezoomed */
      if (z <= 1.02) {
        panRef.current.lerp(zeroVec.current, 0.12);
      }

      /* Clamp pan so mannequin stays visible — more zoom = more pan allowed */
      const maxPan = Math.max(0, (z - 1) * 1.8);
      panRef.current.x = clamp(panRef.current.x, -maxPan, maxPan);
      panRef.current.y = clamp(panRef.current.y, -maxPan, maxPan);

      lerpVec.current.copy(defaultTarget).add(panRef.current);
      orbit.target.lerp(lerpVec.current, 0.15);
    }
  });

  return (
    <>
      <group position={[0, FEET_Y, 0]}>
        <group ref={scaleRef}>
          <group scale={MANNEQUIN_SCALE} position={[0, 0, -0.15]}>
            <ModalMannequin
              activeGroups={activeGroups}
              highlightedMuscle={highlightedMuscle}
            />
            <ModalLabels
              groupKeys={groupKeys}
              onSelectGroup={onSelectGroup}
            />
          </group>
        </group>
      </group>
      <OrbitControls
        ref={orbitRef}
        enablePan={false}
        enableZoom={false}
        enableDamping
        dampingFactor={0.08}
        minPolarAngle={Math.PI / 2}
        maxPolarAngle={Math.PI / 2}
        autoRotateSpeed={0.4}
      />
    </>
  );
}

/* ── Exported modal ────────────────────────────────────────────────────── */

export default function ExerciseAnatomyModal({
  groupKeys,
  onClose,
}: Props) {
  const { t } = useI18n();
  const [sheetGroupKey, setSheetGroupKey] = useState<string | null>(null);
  const [highlightedMuscle, setHighlightedMuscle] = useState<string | null>(
    null,
  );

  /* Close on Escape */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (sheetGroupKey) {
          setSheetGroupKey(null);
          setHighlightedMuscle(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, sheetGroupKey]);

  const handleSelectGroup = useCallback((key: string) => {
    setSheetGroupKey(key);
    setHighlightedMuscle(null);
  }, []);

  const handleSelectMuscle = useCallback((muscle: string) => {
    setHighlightedMuscle((prev) => (prev === muscle ? null : muscle));
  }, []);

  const handleViewAll = useCallback(() => {
    setHighlightedMuscle(null);
  }, []);

  const handleCloseSheet = useCallback(() => {
    setSheetGroupKey(null);
    setHighlightedMuscle(null);
  }, []);

  return (
    <div className="exo-anatomy-modal">
      {/* Canvas */}
      <div className="exo-anatomy-modal-canvas">
        <Canvas
          shadows={false}
          camera={{ position: [0, 0, 3.8], fov: 60, near: 0.01, far: 100 }}
          style={{ background: "transparent" }}
          gl={{ antialias: true, alpha: true }}
        >
          <ModalScene
            groupKeys={groupKeys}
            highlightedMuscle={highlightedMuscle}
            onSelectGroup={handleSelectGroup}
          />
        </Canvas>
      </div>

      {/* Close button */}
      <button
        type="button"
        className="exo-anatomy-modal-close"
        onClick={onClose}
        aria-label={t("anatomy.close")}
      >
        ←
      </button>

      {/* Title */}
      <div className="exo-anatomy-modal-title">
        {t("exerciseAnatomy.musclesWorked")}
      </div>

      {/* Bottom sheet */}
      {sheetGroupKey && (
        <>
          <div
            className="exo-anatomy-sheet-backdrop"
            onClick={handleCloseSheet}
          />
          <div className="exo-anatomy-sheet">
            <div className="exo-anatomy-sheet-handle" />
            <div className="exo-anatomy-sheet-header">
              <span
                className="exo-anatomy-modal-label-dot"
                style={{ background: MUSCLE_GROUPS[sheetGroupKey]?.color }}
              />
              <span className="exo-anatomy-sheet-title">
                {t(`anatomy.groups.${sheetGroupKey}`)}
              </span>
              <button
                type="button"
                className="exo-anatomy-sheet-close"
                onClick={handleCloseSheet}
                aria-label={t("anatomy.close")}
              >
                ✕
              </button>
            </div>

            <div className="exo-anatomy-sheet-desc">
              {t(`anatomy.groupInfo.${sheetGroupKey}`)}
            </div>

            <div className="exo-anatomy-sheet-muscles">
              {(GROUP_MUSCLES[sheetGroupKey] ?? []).map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`exo-anatomy-sheet-muscle${highlightedMuscle === m ? " exo-anatomy-sheet-muscle--active" : ""}`}
                  onClick={() => handleSelectMuscle(m)}
                >
                  {m}
                </button>
              ))}
              {highlightedMuscle && (
                <button
                  type="button"
                  className="exo-anatomy-sheet-viewall"
                  onClick={handleViewAll}
                >
                  {t("exerciseAnatomy.viewAll")}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
