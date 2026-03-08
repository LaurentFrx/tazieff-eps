"use client";

import { useEffect, useMemo, useRef } from "react";
import type { RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import {
  PCFSoftShadowMap,
  Raycaster,
  Vector2,
  Vector3,
  type DirectionalLight,
  type Group,
} from "three";
import HologramMannequin from "./HologramMannequin";

type Props = {
  selectedGroup: string | null;
  highlightedMuscle: string | null;
  onHoverMuscle: (frName: string | null, groupKey: string | null) => void;
  onClickMuscle: (frName: string | null, groupKey: string | null, x: number, y: number) => void;
  onLongPressMuscle: (frName: string, groupKey: string, x: number, y: number) => void;
  bgRef: RefObject<HTMLDivElement | null>;
};

/** Y-offset so mannequin feet sit at shadow line on background image. */
const FEET_Y = -1.28;
const MIN_ZOOM = 1.0;
const MAX_ZOOM = 2.5;
/** Background base zoom + offset (%) — negative X = left, negative Y = up. */
const BASE_BG_SCALE = 1.25;
const BG_OFFSET_X = -6;
const BG_OFFSET_Y = -27;
/** Mannequin is 50 % larger than the raw GLB model. */
const MANNEQUIN_SCALE = 1.5;
/** Orbit / zoom target — mannequin center of mass (chest area), not feet. */
const TARGET_Y = FEET_Y + 1.0;

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

/* eslint-disable @typescript-eslint/no-explicit-any -- drei OrbitControls ref has no exported instance type */
type OrbitControlsRef = React.RefObject<any>;
/* eslint-enable @typescript-eslint/no-explicit-any */

/* ── Inner scene: custom zoom + dolly-to-cursor ────────────────────────── */

function ZoomableScene({
  selectedGroup,
  highlightedMuscle,
  onHoverMuscle,
  onClickMuscle,
  onLongPressMuscle,
  bgRef,
}: Props) {
  const scaleRef = useRef<Group>(null);
  const shadowRef = useRef<Group>(null);
  const lightRef = useRef<DirectionalLight>(null);
  const orbitRef: OrbitControlsRef = useRef(null);
  const zoomRef = useRef(1);
  const pinchRef = useRef(0);

  /* Dolly-to-cursor: 3D point where pinch/scroll focuses */
  const focusPointRef = useRef<Vector3 | null>(null);
  const defaultTarget = useMemo(() => new Vector3(0, TARGET_Y, 0), []);
  const lerpVec = useRef(new Vector3());
  const raycasterObj = useRef(new Raycaster());
  const ndcVec = useRef(new Vector2());

  const { gl, camera, scene } = useThree();

  /* Add shadow-light target to scene graph (required for Three.js shadows) */
  useEffect(() => {
    const light = lightRef.current;
    const parent = shadowRef.current;
    if (light && parent) {
      parent.add(light.target);
      light.target.position.set(0, 0.5, 0);
    }
  }, []);

  /* Set initial orbit target */
  useEffect(() => {
    if (orbitRef.current) {
      orbitRef.current.target.copy(defaultTarget);
    }
  }, [defaultTarget]);

  /* Wheel → zoom + focus capture (desktop) */
  useEffect(() => {
    const el = gl.domElement;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const prev = zoomRef.current;
      zoomRef.current = clamp(prev * (1 - e.deltaY * 0.001), MIN_ZOOM, MAX_ZOOM);

      /* Capture focus point on first zoom-in past threshold */
      if (zoomRef.current > 1.05 && !focusPointRef.current) {
        const rect = el.getBoundingClientRect();
        ndcVec.current.set(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1,
        );
        raycasterObj.current.setFromCamera(ndcVec.current, camera);
        const hits = raycasterObj.current.intersectObjects(scene.children, true);
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

  /* Pinch → zoom + focus capture (mobile dolly-to-cursor) */
  useEffect(() => {
    const el = gl.domElement;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      /* Midpoint of the two fingers → raycast for dolly target */
      const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const rect = el.getBoundingClientRect();
      ndcVec.current.set(
        ((mx - rect.left) / rect.width) * 2 - 1,
        -((my - rect.top) / rect.height) * 2 + 1,
      );
      raycasterObj.current.setFromCamera(ndcVec.current, camera);
      const hits = raycasterObj.current.intersectObjects(scene.children, true);
      if (hits.length > 0) {
        focusPointRef.current = hits[0].point.clone();
      } else {
        /* Fallback: project onto the mannequin's z=0 plane */
        const ray = raycasterObj.current.ray;
        const t = ray.direction.z !== 0 ? -ray.origin.z / ray.direction.z : 0;
        if (t > 0) {
          focusPointRef.current = ray.origin.clone().addScaledVector(ray.direction, t);
        }
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
      /* Clear focus — orbit target will smoothly return to default in useFrame */
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

  /* Sync 3D scale + orbit target + CSS background + shadow each frame */
  useFrame(({ camera: cam }) => {
    const z = zoomRef.current;
    scaleRef.current?.scale.setScalar(z);

    /* Dolly-to-cursor: lerp orbit target toward focus point when zoomed in */
    const orbit = orbitRef.current;
    if (orbit) {
      if (focusPointRef.current && z > 1.05) {
        const t = Math.min(1, (z - 1) / (MAX_ZOOM - 1));
        lerpVec.current.lerpVectors(defaultTarget, focusPointRef.current, t * 0.55);
        orbit.target.lerp(lerpVec.current, 0.08);
      } else {
        orbit.target.lerp(defaultTarget, 0.06);
      }
    }

    if (bgRef.current) {
      bgRef.current.style.transform = `translate(${BG_OFFSET_X}%, ${BG_OFFSET_Y}%) scale(${(BASE_BG_SCALE * z).toFixed(4)})`;
    }
    /* Counter-rotate shadow so it stays fixed relative to the static background */
    if (shadowRef.current) {
      shadowRef.current.rotation.y = Math.atan2(cam.position.x, cam.position.z);
    }
  });

  return (
    <>
      <group position={[0, FEET_Y, 0]}>
        {/* Sun light — counter-rotates with camera so shadow matches static background */}
        <group ref={shadowRef}>
          <directionalLight
            ref={lightRef}
            position={[-3, 6, -2]}
            intensity={0.6}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-left={-5}
            shadow-camera-right={5}
            shadow-camera-top={6}
            shadow-camera-bottom={-2}
            shadow-camera-near={0.5}
            shadow-camera-far={20}
            shadow-bias={-0.003}
            shadow-radius={4}
          />
        </group>

        {/* Ground plane receives the mannequin silhouette shadow */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow renderOrder={-1}>
          <planeGeometry args={[20, 20]} />
          <shadowMaterial transparent opacity={0.35} depthWrite={false} />
        </mesh>

        <group ref={scaleRef}>
          <group scale={MANNEQUIN_SCALE} position={[0, 0, -0.15]}>
            <HologramMannequin
              selectedGroup={selectedGroup}
              highlightedMuscle={highlightedMuscle}
              hoveredMuscle={null}
              wireframe={false}
              silhouetteOpacity={0.36}
              onHoverMuscle={onHoverMuscle}
              onClickMuscle={onClickMuscle}
              onLongPressMuscle={onLongPressMuscle}
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
        autoRotate={!selectedGroup}
        autoRotateSpeed={0.4}
      />
    </>
  );
}

/* ── Exported canvas ─────────────────────────────────────────────────── */

export default function AnatomyCanvas({
  selectedGroup,
  highlightedMuscle,
  onHoverMuscle,
  onClickMuscle,
  onLongPressMuscle,
  bgRef,
}: Props) {
  return (
    <Canvas
      shadows={{ type: PCFSoftShadowMap }}
      camera={{ position: [0, 0, 3.8], fov: 60, near: 0.01, far: 100 }}
      style={{ background: "transparent" }}
      gl={{ antialias: true, alpha: true }}
    >
      <ZoomableScene
        selectedGroup={selectedGroup}
        highlightedMuscle={highlightedMuscle}
        onHoverMuscle={onHoverMuscle}
        onClickMuscle={onClickMuscle}
        onLongPressMuscle={onLongPressMuscle}
        bgRef={bgRef}
      />
    </Canvas>
  );
}
