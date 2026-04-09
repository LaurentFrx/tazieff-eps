"use client";

/* ──────────────────────────────────────────────────────────────
   MuscleHighlightSVG
   Inline SVG of a simplified front-view human body silhouette
   with colored, glowing muscle-group zones.
   No external dependencies — pure React + SVG.
   ────────────────────────────────────────────────────────────── */

type ActiveGroup = { id: string; color: string };

type Props = {
  activeGroups: ActiveGroup[];
  width?: number;
  height?: number;
};

/* ── Y ranges per muscle group (for dynamic viewBox zoom) ──── */
const GROUP_Y_RANGES: Record<string, [number, number]> = {
  "membres-superieurs": [48, 185],
  pectoraux: [72, 116],
  dos: [48, 168],
  abdominaux: [114, 182],
  "membres-inferieurs": [188, 345],
};

/* ── Compute a viewBox that zooms to the active zones ──────── */
function computeViewBox(activeGroups: ActiveGroup[]): string {
  const DEFAULT = "0 0 200 350";

  if (activeGroups.length === 0) return DEFAULT;

  const ranges = activeGroups
    .map((g) => GROUP_Y_RANGES[g.id])
    .filter(Boolean) as [number, number][];

  if (ranges.length === 0) return DEFAULT;

  const rawMinY = Math.min(...ranges.map((r) => r[0]));
  const rawMaxY = Math.max(...ranges.map((r) => r[1]));
  const span = rawMaxY - rawMinY;

  // If the span covers nearly the full body, just show everything
  if (span >= 260) return DEFAULT;

  const padding = 30;
  const minY = Math.max(0, rawMinY - padding);
  const maxY = Math.min(350, rawMaxY + padding);
  const height = maxY - minY;

  return `0 ${minY} 200 ${height}`;
}

/* ── Body silhouette paths ─────────────────────────────────── */

const HEAD = (
  <ellipse cx={100} cy={28} rx={15} ry={17} />
);

const NECK = (
  <rect x={92} y={43} width={16} height={12} rx={4} ry={4} />
);

const TORSO = (
  <path
    d={[
      "M 60,58",
      "Q 60,55 68,55",
      "L 132,55",
      "Q 140,55 140,58",
      "L 142,100",
      "Q 142,140 130,168",
      "Q 124,182 122,190",
      "L 78,190",
      "Q 76,182 70,168",
      "Q 58,140 58,100",
      "Z",
    ].join(" ")}
  />
);

const LEFT_ARM = (
  <path
    d={[
      "M 56,58",
      "Q 48,60 44,74",
      "Q 38,96 36,120",
      "Q 34,150 36,170",
      "Q 37,178 38,180",
      "Q 40,186 44,186",
      "Q 48,186 50,180",
      "Q 54,166 56,150",
      "Q 58,130 58,100",
      "Z",
    ].join(" ")}
  />
);

const RIGHT_ARM = (
  <path
    d={[
      "M 144,58",
      "Q 152,60 156,74",
      "Q 162,96 164,120",
      "Q 166,150 164,170",
      "Q 163,178 162,180",
      "Q 160,186 156,186",
      "Q 152,186 150,180",
      "Q 146,166 144,150",
      "Q 142,130 142,100",
      "Z",
    ].join(" ")}
  />
);

const LEFT_LEG = (
  <path
    d={[
      "M 78,190",
      "Q 74,210 72,240",
      "Q 70,270 72,300",
      "Q 74,320 76,335",
      "Q 78,342 80,342",
      "Q 84,342 86,335",
      "Q 90,318 92,300",
      "Q 96,270 96,240",
      "Q 96,210 94,190",
      "Z",
    ].join(" ")}
  />
);

const RIGHT_LEG = (
  <path
    d={[
      "M 106,190",
      "Q 104,210 104,240",
      "Q 104,270 108,300",
      "Q 110,318 114,335",
      "Q 116,342 120,342",
      "Q 122,342 124,335",
      "Q 126,320 128,300",
      "Q 130,270 130,240",
      "Q 128,210 122,190",
      "Z",
    ].join(" ")}
  />
);

/* ── Muscle zone paths ─────────────────────────────────────── */

const MUSCLE_ZONES: Record<string, React.ReactElement[]> = {
  pectoraux: [
    // Left pectoral
    <path
      key="pec-l"
      d={[
        "M 78,78",
        "Q 76,82 78,94",
        "Q 80,106 86,112",
        "Q 92,116 98,112",
        "Q 100,108 100,96",
        "Q 100,84 96,78",
        "Q 90,74 78,78",
        "Z",
      ].join(" ")}
    />,
    // Right pectoral
    <path
      key="pec-r"
      d={[
        "M 122,78",
        "Q 124,82 122,94",
        "Q 120,106 114,112",
        "Q 108,116 102,112",
        "Q 100,108 100,96",
        "Q 100,84 104,78",
        "Q 110,74 122,78",
        "Z",
      ].join(" ")}
    />,
  ],

  abdominaux: [
    // Central abdominal strip
    <path
      key="abs"
      d={[
        "M 90,116",
        "Q 86,118 86,130",
        "L 86,165",
        "Q 86,174 90,178",
        "Q 96,180 100,180",
        "Q 104,180 110,178",
        "Q 114,174 114,165",
        "L 114,130",
        "Q 114,118 110,116",
        "Q 104,114 100,114",
        "Q 96,114 90,116",
        "Z",
      ].join(" ")}
    />,
  ],

  dos: [
    // Left lat
    <path
      key="lat-l"
      d={[
        "M 64,84",
        "Q 62,96 64,120",
        "Q 66,144 68,156",
        "Q 70,160 74,158",
        "Q 76,154 76,140",
        "Q 76,116 76,96",
        "Q 76,86 72,82",
        "Q 68,82 64,84",
        "Z",
      ].join(" ")}
    />,
    // Right lat
    <path
      key="lat-r"
      d={[
        "M 136,84",
        "Q 138,96 136,120",
        "Q 134,144 132,156",
        "Q 130,160 126,158",
        "Q 124,154 124,140",
        "Q 124,116 124,96",
        "Q 124,86 128,82",
        "Q 132,82 136,84",
        "Z",
      ].join(" ")}
    />,
    // Trapezius
    <path
      key="trap"
      d={[
        "M 84,52",
        "Q 80,50 80,56",
        "Q 82,64 90,68",
        "Q 96,70 100,68",
        "Q 104,70 110,68",
        "Q 118,64 120,56",
        "Q 120,50 116,52",
        "Q 108,56 100,56",
        "Q 92,56 84,52",
        "Z",
      ].join(" ")}
    />,
  ],

  "membres-superieurs": [
    // Left deltoid
    <path
      key="delt-l"
      d={[
        "M 56,60",
        "Q 52,62 52,72",
        "Q 54,82 58,86",
        "Q 62,88 66,84",
        "Q 70,78 68,68",
        "Q 66,60 60,58",
        "Q 58,58 56,60",
        "Z",
      ].join(" ")}
    />,
    // Right deltoid
    <path
      key="delt-r"
      d={[
        "M 144,60",
        "Q 148,62 148,72",
        "Q 146,82 142,86",
        "Q 138,88 134,84",
        "Q 130,78 132,68",
        "Q 134,60 140,58",
        "Q 142,58 144,60",
        "Z",
      ].join(" ")}
    />,
    // Left bicep/tricep strip
    <path
      key="arm-l"
      d={[
        "M 52,88",
        "Q 48,92 44,110",
        "Q 40,130 38,150",
        "Q 38,166 40,176",
        "Q 42,178 46,178",
        "Q 50,178 52,170",
        "Q 56,150 56,130",
        "Q 58,110 56,94",
        "Q 54,88 52,88",
        "Z",
      ].join(" ")}
    />,
    // Right bicep/tricep strip
    <path
      key="arm-r"
      d={[
        "M 148,88",
        "Q 152,92 156,110",
        "Q 160,130 162,150",
        "Q 162,166 160,176",
        "Q 158,178 154,178",
        "Q 150,178 148,170",
        "Q 144,150 144,130",
        "Q 142,110 144,94",
        "Q 146,88 148,88",
        "Z",
      ].join(" ")}
    />,
  ],

  "membres-inferieurs": [
    // Left thigh
    <path
      key="thigh-l"
      d={[
        "M 78,192",
        "Q 74,210 74,230",
        "Q 74,255 76,270",
        "Q 78,278 82,280",
        "Q 88,280 92,278",
        "Q 96,270 96,255",
        "Q 96,230 96,210",
        "Q 94,196 92,192",
        "Z",
      ].join(" ")}
    />,
    // Right thigh
    <path
      key="thigh-r"
      d={[
        "M 108,192",
        "Q 106,196 104,210",
        "Q 104,230 104,255",
        "Q 104,270 108,278",
        "Q 112,280 118,280",
        "Q 122,278 124,270",
        "Q 126,255 126,230",
        "Q 126,210 122,192",
        "Z",
      ].join(" ")}
    />,
    // Left calf
    <path
      key="calf-l"
      d={[
        "M 78,288",
        "Q 76,296 76,310",
        "Q 76,324 78,332",
        "Q 80,338 84,338",
        "Q 88,338 90,332",
        "Q 92,324 92,310",
        "Q 92,296 90,288",
        "Z",
      ].join(" ")}
    />,
    // Right calf
    <path
      key="calf-r"
      d={[
        "M 110,288",
        "Q 108,296 108,310",
        "Q 108,324 110,332",
        "Q 112,338 116,338",
        "Q 120,338 122,332",
        "Q 124,324 124,310",
        "Q 124,296 122,288",
        "Z",
      ].join(" ")}
    />,
  ],
};

/* ── Component ─────────────────────────────────────────────── */

export default function MuscleHighlightSVG({
  activeGroups,
  width = 240,
  height = 320,
}: Props) {
  const activeIds = new Set(activeGroups.map((g) => g.id));
  const colorMap = Object.fromEntries(activeGroups.map((g) => [g.id, g.color]));
  const viewBox = computeViewBox(activeGroups);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      width={width}
      height={height}
      role="img"
      aria-label="Muscles du corps humain"
      style={{ display: "block" }}
    >
      {/* ── Glow filter for active zones ── */}
      <defs>
        <filter id="muscle-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={6} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Body silhouette (subtle, behind everything) ── */}
      <g fill="#1a1a2e" fillOpacity={0.3}>
        {HEAD}
        {NECK}
        {TORSO}
        {LEFT_ARM}
        {RIGHT_ARM}
        {LEFT_LEG}
        {RIGHT_LEG}
      </g>

      {/* ── Muscle zones ── */}
      {Object.entries(MUSCLE_ZONES).map(([groupId, paths]) => {
        const isActive = activeIds.has(groupId);
        return (
          <g
            key={groupId}
            fill={isActive ? colorMap[groupId] : "#1a1a2e"}
            fillOpacity={isActive ? 0.75 : 0.08}
            filter={isActive ? "url(#muscle-glow)" : undefined}
          >
            {paths}
          </g>
        );
      })}

      {/* ── Subtle body outline over everything ── */}
      <g
        fill="none"
        stroke="#333"
        strokeWidth={0.5}
        strokeOpacity={0.3}
      >
        {HEAD}
        {NECK}
        {TORSO}
        {LEFT_ARM}
        {RIGHT_ARM}
        {LEFT_LEG}
        {RIGHT_LEG}
      </g>
    </svg>
  );
}
