import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { CameraControls, useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";
import {
  Box3,
  ClampToEdgeWrapping,
  PCFSoftShadowMap,
  Vector3,
  type DirectionalLight,
  type Group,
} from "three";
import type CameraControlsImpl from "camera-controls";
import HologramMannequin from "./HologramMannequin";

type Props = {
  selectedGroup: string | null;
  highlightedMuscle: string | null;
  showSkeleton?: boolean;
  showWireframe?: boolean;
  showMuscles?: boolean;
  onHoverMuscle: (frName: string | null, groupKey: string | null) => void;
  onClickMuscle: (frName: string | null, groupKey: string | null, x: number, y: number) => void;
  onLongPressMuscle: (frName: string, groupKey: string, x: number, y: number) => void;
};

/* ── Debug settings ────────────────────────────────────────────────── */

type DebugSettings = {
  cameraZoom: number;
  dollySpeed: number;
  truckSpeed: number;
  smoothTime: number;
  minDistance: number;
  maxDistance: number;
  rotateSpeed: number;
  inertiaDecay: number;
  mannequinScale: number;
  innerScale: number;
  bgPositionX: number;
  bgPositionY: number;
  bgPositionZ: number;
  bgWidth: number;
  bgHeight: number;
  wireframeOpacity: number;
  pointSize: number;
  pointOpacity: number;
  pointColor: string;
  ambientIntensity: number;
  mainLightIntensity: number;
};

const DEFAULT_SETTINGS: DebugSettings = {
  cameraZoom: 250,
  dollySpeed: 1.5,
  truckSpeed: 2.0,
  smoothTime: 0.1,
  minDistance: 0.4,
  maxDistance: 5.0,
  rotateSpeed: 0.006,
  inertiaDecay: 0.92,
  mannequinScale: 1.0,
  innerScale: 1.5,
  bgPositionX: -0.60,
  bgPositionY: 2.30,
  bgPositionZ: 0.00,
  bgWidth: 9.0,
  bgHeight: 6.0,
  wireframeOpacity: 0.17,
  pointSize: 1.0,
  pointOpacity: 1.0,
  pointColor: "#d4a54a",
  ambientIntensity: 0.8,
  mainLightIntensity: 1.2,
};

/** Double-tap detection threshold (ms). */
const DOUBLE_TAP_MS = 300;
/** Max distance (px²) to still count as a tap, not a drag. */
const TAP_THRESHOLD_SQ = 25;
/** Max duration (ms) for a single tap gesture. */
const TAP_MAX_DURATION = 200;
/** Angular velocity threshold below which inertia stops. */
const INERTIA_EPSILON = 0.0001;

/* ── Shadow map (native Three.js DirectionalLight + receiveShadow) ── */

/* ── Background plane — fixed in scene, follows camera zoom/pan ──── */

function BackgroundPlane({ x, y, z, width, height }: {
  x: number; y: number; z: number; width: number; height: number;
}) {
  const texture = useTexture("/media/anatomy-bg.webp", (tex) => {
    tex.wrapS = ClampToEdgeWrapping;
    tex.wrapT = ClampToEdgeWrapping;
  });

  return (
    <mesh position={[x, y, z]} renderOrder={-2}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} depthWrite={false} />
    </mesh>
  );
}

/* ── Slider definitions for debug panel ────────────────────────────── */

type SliderDef = { key: keyof DebugSettings; label: string; min: number; max: number; step: number };
type ColorDef = { key: keyof DebugSettings; label: string };

const SLIDER_GROUPS: { title: string; sliders: SliderDef[]; colors?: ColorDef[] }[] = [
  {
    title: "CAMÉRA",
    sliders: [
      { key: "cameraZoom", label: "cameraZoom (Taille écran)", min: 100, max: 500, step: 10 },
      { key: "dollySpeed", label: "dollySpeed (Vitesse zoom)", min: 0.1, max: 3.0, step: 0.1 },
      { key: "truckSpeed", label: "truckSpeed (Vitesse déplacement)", min: 0.5, max: 5.0, step: 0.1 },
      { key: "smoothTime", label: "smoothTime (Inertie)", min: 0.01, max: 0.5, step: 0.01 },
      { key: "minDistance", label: "minDistance", min: 0.1, max: 2.0, step: 0.1 },
      { key: "maxDistance", label: "maxDistance", min: 3.0, max: 10.0, step: 0.5 },
    ],
  },
  {
    title: "TURNTABLE",
    sliders: [
      { key: "rotateSpeed", label: "rotateSpeed (Sensibilité rotation)", min: 0.001, max: 0.02, step: 0.001 },
      { key: "inertiaDecay", label: "inertiaDecay (Durée inertie rotation)", min: 0.8, max: 0.99, step: 0.01 },
    ],
  },
  {
    title: "MANNEQUIN",
    sliders: [
      { key: "mannequinScale", label: "mannequinScale (Taille modèle)", min: 0.2, max: 1.0, step: 0.05 },
      { key: "innerScale", label: "innerScale (Taille interne)", min: 0.5, max: 3.0, step: 0.1 },
    ],
  },
  {
    title: "FOND",
    sliders: [
      { key: "bgWidth", label: "bgWidth (Largeur fond)", min: 3, max: 30, step: 0.5 },
      { key: "bgHeight", label: "bgHeight (Hauteur fond)", min: 2, max: 20, step: 0.5 },
    ],
  },
  {
    title: "WIREFRAME",
    sliders: [
      { key: "wireframeOpacity", label: "wireframeOpacity (Wireframe opacité)", min: 0, max: 1.0, step: 0.01 },
    ],
  },
  {
    title: "POINTS",
    sliders: [
      { key: "pointSize", label: "pointSize (Points taille px)", min: 0.5, max: 10, step: 0.5 },
      { key: "pointOpacity", label: "pointOpacity (Points intensité)", min: 0, max: 1.0, step: 0.01 },
    ],
    colors: [
      { key: "pointColor", label: "pointColor (Points couleur)" },
    ],
  },
  {
    title: "ÉCLAIRAGE",
    sliders: [
      { key: "ambientIntensity", label: "ambientIntensity (Lumière ambiante)", min: 0, max: 2.0, step: 0.1 },
      { key: "mainLightIntensity", label: "mainLightIntensity (Lumière principale)", min: 0, max: 3.0, step: 0.1 },
    ],
  },
];

/* ── Settings Panel (HTML overlay) ─────────────────────────────────── */

function SettingsPanel({
  settings,
  onChange,
}: {
  settings: DebugSettings;
  onChange: (s: DebugSettings) => void;
}) {
  const [open, setOpen] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(JSON.stringify(settings, null, 2));
  }, [settings]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          bottom: 16,
          left: 16,
          zIndex: 100,
          background: "rgba(0,0,0,0.7)",
          color: "#fff",
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: 8,
          padding: "8px 12px",
          fontSize: 11,
          cursor: "pointer",
          fontFamily: "monospace",
        }}
      >
        Debug
      </button>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        left: 16,
        zIndex: 100,
        background: "rgba(0,0,0,0.88)",
        color: "#fff",
        border: "1px solid rgba(255,255,255,0.2)",
        borderRadius: 10,
        padding: 12,
        fontFamily: "monospace",
        fontSize: 10,
        maxHeight: "calc(100vh - 32px)",
        overflowY: "auto",
        width: 340,
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Debug Settings
        </span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 14 }}
        >
          ✕
        </button>
      </div>

      {SLIDER_GROUPS.map((group) => (
        <div key={group.title} style={{ marginBottom: 8 }}>
          <div style={{
            color: "rgba(0,212,255,0.6)",
            fontSize: 9,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: 4,
          }}>
            {group.title}
          </div>
          {group.sliders.map((s) => (
            <div key={s.key} style={{ marginBottom: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 1 }}>
                <label style={{ fontSize: 9, color: "rgba(255,255,255,0.7)" }}>
                  {s.label}
                </label>
                <span style={{ fontSize: 9, color: "#00D4FF", fontWeight: 600 }}>
                  {(settings[s.key] as number).toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min={s.min}
                max={s.max}
                step={s.step}
                value={settings[s.key] as number}
                onChange={(e) => onChange({ ...settings, [s.key]: parseFloat(e.target.value) })}
                style={{ width: "100%", accentColor: "#00D4FF" }}
              />
            </div>
          ))}
          {group.colors?.map((c) => (
            <div key={c.key} style={{ marginBottom: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 1 }}>
                <label style={{ fontSize: 9, color: "rgba(255,255,255,0.7)" }}>
                  {c.label}
                </label>
                <span style={{ fontSize: 9, color: "#00D4FF", fontWeight: 600 }}>
                  {settings[c.key]}
                </span>
              </div>
              <input
                type="color"
                value={settings[c.key] as string}
                onChange={(e) => onChange({ ...settings, [c.key]: e.target.value })}
                style={{ width: "100%", height: 24, cursor: "pointer", border: "none", background: "transparent" }}
              />
            </div>
          ))}
        </div>
      ))}

      <button
        type="button"
        onClick={handleCopy}
        style={{
          width: "100%",
          padding: "6px 0",
          background: "rgba(0,212,255,0.15)",
          border: "1px solid rgba(0,212,255,0.3)",
          borderRadius: 6,
          color: "#00D4FF",
          fontSize: 10,
          cursor: "pointer",
          fontFamily: "monospace",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        Copier valeurs
      </button>
    </div>
  );
}

/* ── Inner scene: turntable + CameraControls (dolly/truck only) ──── */

function Scene({
  selectedGroup,
  highlightedMuscle,
  showSkeleton,
  showWireframe,
  showMuscles,
  onHoverMuscle,
  onClickMuscle,
  onLongPressMuscle,
  settings,
}: Props & { settings: DebugSettings }) {
  const mannequinGroupRef = useRef<Group>(null);
  const turntableRef = useRef<Group>(null);
  const lightRef = useRef<DirectionalLight>(null);
  const controlsRef = useRef<CameraControlsImpl>(null);

  /* Turntable state */
  const rotationY = useRef(0);
  const angularVelocity = useRef(0);
  const isDragging = useRef(false);
  const lastPointerX = useRef(0);
  const activePointers = useRef(new Set<number>());

  /* Double-tap state */
  const lastTapTime = useRef(0);
  const pointerStart = useRef({ x: 0, y: 0, time: 0 });

  /* Keep settings in a ref for event handlers & useFrame */
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const { gl, camera } = useThree();

  /* Disable CameraControls single-finger rotation — turntable handles it */
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.mouseButtons.left = 0;   // ACTION.NONE
    controls.touches.one = 0;         // ACTION.NONE
    // Keep defaults: right-click=TRUCK, wheel=DOLLY, two-finger=DOLLY_TRUCK
  }, []);

  /* Add shadow light target to scene (required for Three.js directional shadows) */
  useEffect(() => {
    const light = lightRef.current;
    if (!light) return;
    light.target.position.set(0, 0.5, 0);
    light.parent?.add(light.target);
  }, []);

  /* Perspective camera: zoom handled by CameraControls dolly, not camera.zoom */

  /* Update CameraControls imperatively when settings change */
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.dollySpeed = settings.dollySpeed;
    controls.truckSpeed = settings.truckSpeed;
    controls.smoothTime = settings.smoothTime;
    controls.minDistance = settings.minDistance;
    controls.maxDistance = settings.maxDistance;
  }, [settings.dollySpeed, settings.truckSpeed, settings.smoothTime, settings.minDistance, settings.maxDistance]);

  /* Center camera on mannequin + anchor feet to ground */
  useEffect(() => {
    const controls = controlsRef.current;
    const mannequin = mannequinGroupRef.current;
    if (!controls || !mannequin) return;

    const id = requestAnimationFrame(() => {
      const box = new Box3().setFromObject(mannequin);
      // Anchor feet to y=0
      mannequin.position.y -= box.min.y;
      // Recompute after repositioning
      box.setFromObject(mannequin);
      const center = box.getCenter(new Vector3());

      // Perspective: position camera in front, looking at center
      controls.setLookAt(0, center.y, 3.5, 0, center.y, 0, false);
      controls.saveState();
    });

    return () => cancelAnimationFrame(id);
  }, []);

  /* Turntable single-finger drag + double-tap reset */
  useEffect(() => {
    const el = gl.domElement;

    const onPointerDown = (e: PointerEvent) => {
      activePointers.current.add(e.pointerId);
      pointerStart.current = { x: e.clientX, y: e.clientY, time: Date.now() };

      if (activePointers.current.size === 1) {
        isDragging.current = true;
        lastPointerX.current = e.clientX;
        angularVelocity.current = 0;
      } else {
        // Multi-touch → stop rotation, let CameraControls handle dolly/truck
        isDragging.current = false;
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging.current || activePointers.current.size !== 1) return;
      const dx = e.clientX - lastPointerX.current;
      const speed = settingsRef.current.rotateSpeed;
      rotationY.current += dx * speed;
      angularVelocity.current = dx * speed;
      lastPointerX.current = e.clientX;
    };

    const onPointerUp = (e: PointerEvent) => {
      activePointers.current.delete(e.pointerId);
      if (activePointers.current.size === 0) {
        isDragging.current = false;
      }

      // Double-tap detection
      const dx = e.clientX - pointerStart.current.x;
      const dy = e.clientY - pointerStart.current.y;
      const duration = Date.now() - pointerStart.current.time;
      if (dx * dx + dy * dy <= TAP_THRESHOLD_SQ && duration <= TAP_MAX_DURATION) {
        const now = Date.now();
        if (now - lastTapTime.current < DOUBLE_TAP_MS) {
          // Reset camera position AND mannequin rotation
          controlsRef.current?.reset(true);
          rotationY.current = 0;
          angularVelocity.current = 0;
          lastTapTime.current = 0;
        } else {
          lastTapTime.current = now;
        }
      }
    };

    const onPointerCancel = (e: PointerEvent) => {
      activePointers.current.delete(e.pointerId);
      if (activePointers.current.size === 0) {
        isDragging.current = false;
      }
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerCancel);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerCancel);
    };
  }, [gl]);

  /* Apply turntable rotation + inertia each frame */
  useFrame(() => {
    const decay = settingsRef.current.inertiaDecay;
    if (!isDragging.current && Math.abs(angularVelocity.current) > INERTIA_EPSILON) {
      rotationY.current += angularVelocity.current;
      angularVelocity.current *= decay;
    } else if (!isDragging.current) {
      angularVelocity.current = 0;
    }

    if (turntableRef.current) {
      turntableRef.current.rotation.y = rotationY.current;
    }
  });

  return (
    <>
      {/* Background plane — fixed in scene, does NOT rotate */}
      <BackgroundPlane
        x={settings.bgPositionX}
        y={settings.bgPositionY}
        z={settings.bgPositionZ}
        width={settings.bgWidth}
        height={settings.bgHeight}
      />

      <group>
        {/* Shadow-casting sun light — OUTSIDE turntable so shadow stays fixed */}
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

        {/* Ground plane receives shadow — OUTSIDE turntable */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow renderOrder={-1}>
          <planeGeometry args={[20, 20]} />
          <shadowMaterial transparent opacity={0.35} depthWrite={false} />
        </mesh>

        {/* Turntable — rotates mannequin on Y axis */}
        <group ref={turntableRef} scale={settings.mannequinScale}>
          <group ref={mannequinGroupRef}>
            <group scale={settings.innerScale} position={[0, 0, -0.15]}>
              <HologramMannequin
                selectedGroup={selectedGroup}
                highlightedMuscle={highlightedMuscle}
                hoveredMuscle={null}
                wireframe={false}
                showSkeleton={showSkeleton}
                showWireframe={showWireframe}
                showMuscles={showMuscles}
                silhouetteOpacity={settings.wireframeOpacity}
                pointSize={settings.pointSize}
                pointOpacity={settings.pointOpacity}
                pointColor={settings.pointColor}
                ambientIntensity={settings.ambientIntensity}
                mainLightIntensity={settings.mainLightIntensity}
                onHoverMuscle={onHoverMuscle}
                onClickMuscle={onClickMuscle}
                onLongPressMuscle={onLongPressMuscle}
              />
            </group>
          </group>
        </group>
      </group>

      {/* CameraControls: dolly (zoom) + truck (pan) only — no rotation */}
      <CameraControls
        ref={controlsRef}
        dollyToCursor
        smoothTime={settings.smoothTime}
        draggingSmoothTime={0.04}
        minPolarAngle={Math.PI / 2}
        maxPolarAngle={Math.PI / 2}
        minAzimuthAngle={0}
        maxAzimuthAngle={0}
        minDistance={settings.minDistance}
        maxDistance={settings.maxDistance}
        dollySpeed={settings.dollySpeed}
        truckSpeed={settings.truckSpeed}
      />
    </>
  );
}

/* ── Exported canvas ─────────────────────────────────────────────── */

export default function AnatomyCanvas({
  selectedGroup,
  highlightedMuscle,
  showSkeleton,
  showWireframe,
  showMuscles,
  onHoverMuscle,
  onClickMuscle,
  onLongPressMuscle,
}: Props) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [showDebug] = useState(
    () => typeof window !== "undefined"
      && new URLSearchParams(window.location.search).has("debug"),
  );

  return (
    <>
      <Canvas
        shadows={{ type: PCFSoftShadowMap }}
        camera={{ position: [0, 0.8, 3.5], fov: 60, near: 0.01, far: 100 }}
        gl={{ antialias: true, stencil: true }}
      >
        <Scene
          selectedGroup={selectedGroup}
          highlightedMuscle={highlightedMuscle}
          showSkeleton={showSkeleton}
          showWireframe={showWireframe}
          showMuscles={showMuscles}
          onHoverMuscle={onHoverMuscle}
          onClickMuscle={onClickMuscle}
          onLongPressMuscle={onLongPressMuscle}
          settings={settings}
        />
      </Canvas>
      {showDebug && <SettingsPanel settings={settings} onChange={setSettings} />}
    </>
  );
}
