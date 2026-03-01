import { type ThreeEvent } from "@react-three/fiber";

/* ─── Mesh spec types ─────────────────────────────────────────────────── */

type Vec3 = [number, number, number];

type MeshSpec = {
  muscleId: string;
  geo: "sphere" | "cylinder" | "box";
  args: number[];
  position: Vec3;
  rotation?: Vec3;
  scale?: Vec3;
};

/* ─── Mannequin mesh definitions (19 zones + decorative) ──────────────── */

const MESHES: MeshSpec[] = [
  // ── Decorative (head, neck, feet — not selectable) ────────────────────
  { muscleId: "", geo: "sphere", args: [0.11, 16, 16], position: [0, 0.82, 0] },
  { muscleId: "", geo: "cylinder", args: [0.045, 0.055, 0.10, 8], position: [0, 0.72, 0] },
  { muscleId: "", geo: "box", args: [0.06, 0.03, 0.12], position: [-0.10, -0.88, 0.02] },
  { muscleId: "", geo: "box", args: [0.06, 0.03, 0.12], position: [0.10, -0.88, 0.02] },

  // ── 1. Trapèzes ──────────────────────────────────────────────────────
  { muscleId: "trapezes", geo: "box", args: [0.24, 0.12, 0.08], position: [0, 0.64, -0.02] },

  // ── 2. Deltoïdes L+R ────────────────────────────────────────────────
  { muscleId: "deltoides", geo: "sphere", args: [0.06, 12, 12], position: [-0.24, 0.56, 0] },
  { muscleId: "deltoides", geo: "sphere", args: [0.06, 12, 12], position: [0.24, 0.56, 0] },

  // ── 3. Infra-épineux ────────────────────────────────────────────────
  { muscleId: "infra-epineux", geo: "box", args: [0.20, 0.10, 0.05], position: [0, 0.54, -0.07] },

  // ── 4. Pectoraux ────────────────────────────────────────────────────
  { muscleId: "pectoraux", geo: "box", args: [0.26, 0.16, 0.08], position: [0, 0.46, 0.06] },

  // ── 5. Grand dorsal ─────────────────────────────────────────────────
  { muscleId: "grand-dorsal", geo: "box", args: [0.30, 0.22, 0.07], position: [0, 0.38, -0.07] },

  // ── 6. Dentelé L+R ──────────────────────────────────────────────────
  { muscleId: "dentele", geo: "box", args: [0.04, 0.16, 0.07], position: [-0.16, 0.42, 0.03] },
  { muscleId: "dentele", geo: "box", args: [0.04, 0.16, 0.07], position: [0.16, 0.42, 0.03] },

  // ── 7. Biceps L+R ───────────────────────────────────────────────────
  { muscleId: "biceps", geo: "cylinder", args: [0.038, 0.032, 0.22, 8], position: [-0.27, 0.34, 0.02], rotation: [0, 0, 0.08] },
  { muscleId: "biceps", geo: "cylinder", args: [0.038, 0.032, 0.22, 8], position: [0.27, 0.34, 0.02], rotation: [0, 0, -0.08] },

  // ── 8. Triceps L+R ──────────────────────────────────────────────────
  { muscleId: "triceps", geo: "cylinder", args: [0.035, 0.028, 0.22, 8], position: [-0.27, 0.34, -0.02], rotation: [0, 0, 0.08] },
  { muscleId: "triceps", geo: "cylinder", args: [0.035, 0.028, 0.22, 8], position: [0.27, 0.34, -0.02], rotation: [0, 0, -0.08] },

  // ── 9. Avant-bras L+R ───────────────────────────────────────────────
  { muscleId: "avant-bras", geo: "cylinder", args: [0.032, 0.022, 0.22, 8], position: [-0.29, 0.12, 0], rotation: [0, 0, 0.05] },
  { muscleId: "avant-bras", geo: "cylinder", args: [0.032, 0.022, 0.22, 8], position: [0.29, 0.12, 0], rotation: [0, 0, -0.05] },

  // ── 10. Abdominaux ──────────────────────────────────────────────────
  { muscleId: "abdominaux", geo: "box", args: [0.14, 0.20, 0.07], position: [0, 0.20, 0.05] },

  // ── 11. Obliques L+R ────────────────────────────────────────────────
  { muscleId: "obliques", geo: "box", args: [0.05, 0.18, 0.08], position: [-0.12, 0.20, 0.02] },
  { muscleId: "obliques", geo: "box", args: [0.05, 0.18, 0.08], position: [0.12, 0.20, 0.02] },

  // ── 12. Carré des lombes ────────────────────────────────────────────
  { muscleId: "carre-des-lombes", geo: "box", args: [0.18, 0.12, 0.06], position: [0, 0.16, -0.06] },

  // ── 13. Grand fessier L+R ──────────────────────────────────────────
  { muscleId: "grand-fessier", geo: "sphere", args: [0.08, 12, 12], position: [-0.08, -0.02, -0.04], scale: [1.2, 0.9, 1] },
  { muscleId: "grand-fessier", geo: "sphere", args: [0.08, 12, 12], position: [0.08, -0.02, -0.04], scale: [1.2, 0.9, 1] },

  // ── 14. Moyen fessier L+R ──────────────────────────────────────────
  { muscleId: "moyen-fessier", geo: "sphere", args: [0.055, 12, 12], position: [-0.16, 0.0, 0] },
  { muscleId: "moyen-fessier", geo: "sphere", args: [0.055, 12, 12], position: [0.16, 0.0, 0] },

  // ── 15. Quadriceps L+R ─────────────────────────────────────────────
  { muscleId: "quadriceps", geo: "cylinder", args: [0.065, 0.050, 0.34, 8], position: [-0.10, -0.30, 0.02] },
  { muscleId: "quadriceps", geo: "cylinder", args: [0.065, 0.050, 0.34, 8], position: [0.10, -0.30, 0.02] },

  // ── 16. Ischio-jambiers L+R ────────────────────────────────────────
  { muscleId: "ischio-jambiers", geo: "cylinder", args: [0.058, 0.045, 0.32, 8], position: [-0.10, -0.30, -0.02] },
  { muscleId: "ischio-jambiers", geo: "cylinder", args: [0.058, 0.045, 0.32, 8], position: [0.10, -0.30, -0.02] },

  // ── 17. Adducteurs L+R ─────────────────────────────────────────────
  { muscleId: "adducteurs", geo: "cylinder", args: [0.032, 0.025, 0.26, 8], position: [-0.04, -0.28, 0] },
  { muscleId: "adducteurs", geo: "cylinder", args: [0.032, 0.025, 0.26, 8], position: [0.04, -0.28, 0] },

  // ── 18. Jambier antérieur L+R ──────────────────────────────────────
  { muscleId: "jambier-anterieur", geo: "cylinder", args: [0.042, 0.032, 0.30, 8], position: [-0.10, -0.67, 0.02] },
  { muscleId: "jambier-anterieur", geo: "cylinder", args: [0.042, 0.032, 0.30, 8], position: [0.10, -0.67, 0.02] },

  // ── 19. Mollets L+R ────────────────────────────────────────────────
  { muscleId: "mollets", geo: "cylinder", args: [0.048, 0.028, 0.28, 8], position: [-0.10, -0.65, -0.02] },
  { muscleId: "mollets", geo: "cylinder", args: [0.048, 0.028, 0.28, 8], position: [0.10, -0.65, -0.02] },
];

/* ─── Geometry helper ─────────────────────────────────────────────────── */

function Geo({ type, args }: { type: MeshSpec["geo"]; args: number[] }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const a = args as any;
  switch (type) {
    case "sphere":
      return <sphereGeometry args={a} />;
    case "cylinder":
      return <cylinderGeometry args={a} />;
    case "box":
      return <boxGeometry args={a} />;
  }
}

/* ─── Single muscle mesh ──────────────────────────────────────────────── */

function MuscleMesh({
  spec,
  selected,
  antagonist,
  hovered,
  onSelect,
  onHover,
}: {
  spec: MeshSpec;
  selected: string | null;
  antagonist: string | null;
  hovered: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}) {
  const { muscleId, geo, args, position, rotation, scale } = spec;
  const isSelectable = muscleId !== "";
  const isSelected = selected === muscleId;
  const isAntagonist = antagonist === muscleId;
  const isHovered = hovered === muscleId;

  let color = "#00D4FF";
  let wireframe = true;
  let opacity = 0.6;

  if (!isSelectable) {
    opacity = 0.2;
  } else if (isSelected) {
    color = "#FF6B00";
    wireframe = false;
    opacity = 0.3;
  } else if (isHovered) {
    color = "#00FFFF";
    opacity = 0.9;
  } else if (isAntagonist) {
    color = "#66EEFF";
    opacity = 0.8;
  }

  const handleClick = isSelectable
    ? (e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onSelect(muscleId);
      }
    : undefined;

  const handleOver = isSelectable
    ? (e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onHover(muscleId);
        document.body.style.cursor = "pointer";
      }
    : undefined;

  const handleOut = isSelectable
    ? () => {
        onHover(null);
        document.body.style.cursor = "auto";
      }
    : undefined;

  return (
    <mesh
      position={position}
      rotation={rotation ?? [0, 0, 0]}
      scale={scale ?? [1, 1, 1]}
      onClick={handleClick}
      onPointerOver={handleOver}
      onPointerOut={handleOut}
    >
      <Geo type={geo} args={args} />
      <meshBasicMaterial
        color={color}
        wireframe={wireframe}
        transparent
        opacity={opacity}
        depthWrite={false}
      />
    </mesh>
  );
}

/* ─── Exported mannequin group ────────────────────────────────────────── */

type Props = {
  selected: string | null;
  antagonist: string | null;
  hovered: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
};

export default function HologramMannequin({
  selected,
  antagonist,
  hovered,
  onSelect,
  onHover,
}: Props) {
  return (
    <group>
      {MESHES.map((spec, i) => (
        <MuscleMesh
          key={i}
          spec={spec}
          selected={selected}
          antagonist={antagonist}
          hovered={hovered}
          onSelect={onSelect}
          onHover={onHover}
        />
      ))}
    </group>
  );
}
