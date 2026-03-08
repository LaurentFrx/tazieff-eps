"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html, useGLTF } from "@react-three/drei";
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
const TARGET_Y = FEET_Y + 1.0;
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
        transparent: true,
        opacity: 1,
        side: THREE.DoubleSide,
      });
      mesh.renderOrder = 1;
      entries.push({ mesh, groupKey, baseFrName });
    });
    meshesRef.current = entries;

    silhouetteScene.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      (child as THREE.Mesh).material = new THREE.MeshBasicMaterial({
        color: 0x9b7340,
        transparent: true,
        opacity: 0.25,
        wireframe: true,
        side: THREE.BackSide,
        depthWrite: false,
      });
      (child as THREE.Mesh).renderOrder = -2;
    });
  }, [musclesScene, silhouetteScene]);

  /* Update materials when selection changes */
  useEffect(() => {
    for (const { mesh, groupKey, baseFrName } of meshesRef.current) {
      const mat = mesh.material as THREE.MeshPhongMaterial;
      const ud = mesh.userData as { originalColor?: THREE.Color };
      if (!ud.originalColor) {
        ud.originalColor = new THREE.Color(
          groupKey ? MUSCLE_GROUPS[groupKey].color : 0x888888,
        );
      }

      if (highlightedMuscle) {
        /* Single sub-muscle highlighted */
        if (baseFrName === highlightedMuscle) {
          mat.opacity = 1;
          mat.emissive.copy(ud.originalColor).multiplyScalar(0.8);
        } else if (groupKey && activeGroups.has(groupKey)) {
          mat.opacity = 0.3;
          mat.emissive.set(0x000000);
        } else {
          mat.opacity = 0.05;
          mat.emissive.set(0x000000);
        }
      } else if (groupKey && activeGroups.has(groupKey)) {
        /* Full group highlight */
        mat.opacity = 1;
        mat.emissive.copy(ud.originalColor).multiplyScalar(0.6);
      } else {
        /* Inactive */
        mat.opacity = 0.06;
        mat.emissive.set(0x000000);
      }
    }
  }, [activeGroups, highlightedMuscle]);

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
  const pinchRef = useRef(0);
  const defaultTarget = useMemo(() => new THREE.Vector3(0, TARGET_Y, 0), []);
  const { gl, camera, scene } = useThree();

  const focusPointRef = useRef<THREE.Vector3 | null>(null);
  const lerpVec = useRef(new THREE.Vector3());
  const raycasterObj = useRef(new THREE.Raycaster());
  const ndcVec = useRef(new THREE.Vector2());

  const activeGroups = useMemo(() => new Set(groupKeys), [groupKeys]);

  /* Set initial orbit target */
  useEffect(() => {
    if (orbitRef.current) {
      orbitRef.current.target.copy(defaultTarget);
    }
  }, [defaultTarget]);

  /* Wheel → zoom */
  useEffect(() => {
    const el = gl.domElement;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const prev = zoomRef.current;
      zoomRef.current = clamp(
        prev * (1 - e.deltaY * 0.001),
        MIN_ZOOM,
        MAX_ZOOM,
      );
      if (zoomRef.current > 1.05 && !focusPointRef.current) {
        const rect = el.getBoundingClientRect();
        ndcVec.current.set(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1,
        );
        raycasterObj.current.setFromCamera(ndcVec.current, camera);
        const hits = raycasterObj.current.intersectObjects(
          scene.children,
          true,
        );
        if (hits.length > 0) {
          focusPointRef.current = hits[0].point.clone();
        }
      } else if (zoomRef.current <= 1.02) {
        focusPointRef.current = null;
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [gl, camera, scene]);

  /* Pinch → zoom + focus */
  useEffect(() => {
    const el = gl.domElement;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const rect = el.getBoundingClientRect();
      ndcVec.current.set(
        ((mx - rect.left) / rect.width) * 2 - 1,
        -((my - rect.top) / rect.height) * 2 + 1,
      );
      raycasterObj.current.setFromCamera(ndcVec.current, camera);
      const hits = raycasterObj.current.intersectObjects(
        scene.children,
        true,
      );
      if (hits.length > 0) {
        focusPointRef.current = hits[0].point.clone();
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (pinchRef.current > 0) {
        zoomRef.current = clamp(
          zoomRef.current * (dist / pinchRef.current),
          MIN_ZOOM,
          MAX_ZOOM,
        );
      }
      pinchRef.current = dist;
    };
    const resetPinch = () => {
      pinchRef.current = 0;
      focusPointRef.current = null;
    };
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", resetPinch);
    el.addEventListener("touchcancel", resetPinch);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", resetPinch);
      el.removeEventListener("touchcancel", resetPinch);
    };
  }, [gl, camera, scene]);

  /* Per-frame sync */
  useFrame(() => {
    const z = zoomRef.current;
    scaleRef.current?.scale.setScalar(z);

    const orbit = orbitRef.current;
    if (orbit) {
      if (focusPointRef.current && z > 1.05) {
        const t = Math.min(1, (z - 1) / (MAX_ZOOM - 1));
        lerpVec.current.lerpVectors(
          defaultTarget,
          focusPointRef.current,
          t * 0.55,
        );
        orbit.target.lerp(lerpVec.current, 0.08);
      } else {
        orbit.target.lerp(defaultTarget, 0.06);
      }
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
