"use client";

import type { AnatomyFace } from "./anatomy-data";

type Props = {
  face: AnatomyFace;
  selected: string | null;
  antagonist: string | null;
  hovered: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  zoneLabels: Record<string, string>;
};

/* ─── Body outline (shared silhouette for both faces) ─────────────────── */

function BodyOutline() {
  return (
    <g className="body-outline-group">
      {/* Head */}
      <ellipse className="body-outline-head" cx="100" cy="26" rx="16" ry="20" />
      {/* Neck */}
      <path className="body-outline" d="M 92,44 L 92,54 L 108,54 L 108,44" />
      {/* Torso */}
      <path
        className="body-outline"
        d="M 92,54 L 62,60 L 48,68 L 44,82 L 40,110 L 34,148 L 32,155
           L 26,195 L 22,225 L 20,242 M 108,54 L 138,60 L 152,68 L 156,82
           L 160,110 L 166,148 L 168,155 L 174,195 L 178,225 L 180,242"
      />
      {/* Torso inner */}
      <path
        className="body-outline"
        d="M 62,60 L 58,82 L 56,110 L 58,138 L 62,160 L 66,180 L 68,192
           L 70,200 L 82,212 L 96,216 L 100,216 L 104,216 L 118,212
           L 130,200 L 132,192 L 134,180 L 138,160 L 142,138 L 144,110
           L 142,82 L 138,60"
      />
      {/* Left leg */}
      <path
        className="body-outline"
        d="M 82,212 L 76,260 L 72,310 L 70,340 L 68,380 L 70,420
           L 72,440 L 68,458 L 66,464 L 86,464 L 86,458 L 84,440
           L 88,420 L 92,380 L 92,340 L 92,310 L 94,260 L 96,216"
      />
      {/* Right leg */}
      <path
        className="body-outline"
        d="M 118,212 L 124,260 L 128,310 L 130,340 L 132,380 L 130,420
           L 128,440 L 132,458 L 134,464 L 114,464 L 114,458 L 116,440
           L 112,420 L 108,380 L 108,340 L 108,310 L 106,260 L 104,216"
      />
    </g>
  );
}

/* ─── Zone paths: ANTERIOR ────────────────────────────────────────────── */

const ANTERIOR_ZONES: Record<string, string> = {
  pectoraux:
    "M 68,70 L 60,78 L 58,95 L 60,112 L 68,118 L 82,120 L 96,118 L 96,70 Z M 132,70 L 140,78 L 142,95 L 140,112 L 132,118 L 118,120 L 104,118 L 104,70 Z",
  biceps:
    "M 48,74 L 44,86 L 40,110 L 36,138 L 34,148 L 40,150 L 44,138 L 50,110 L 54,86 L 56,78 Z M 152,74 L 156,86 L 160,110 L 164,138 L 166,148 L 160,150 L 156,138 L 150,110 L 146,86 L 144,78 Z",
  "avant-bras":
    "M 34,156 L 30,180 L 26,205 L 22,230 L 20,242 L 26,244 L 30,230 L 34,205 L 38,180 L 40,156 Z M 166,156 L 170,180 L 174,205 L 178,230 L 180,242 L 174,244 L 170,230 L 166,205 L 162,180 L 160,156 Z",
  dentele:
    "M 58,86 L 56,100 L 56,118 L 58,132 L 64,132 L 66,118 L 66,100 L 64,86 Z M 142,86 L 144,100 L 144,118 L 142,132 L 136,132 L 134,118 L 134,100 L 136,86 Z",
  abdominaux:
    "M 84,120 L 84,178 L 88,190 L 96,196 L 100,196 L 104,196 L 112,190 L 116,178 L 116,120 Z",
  obliques:
    "M 66,124 L 62,150 L 64,172 L 68,188 L 76,196 L 82,192 L 82,178 L 82,124 Z M 134,124 L 138,150 L 136,172 L 132,188 L 124,196 L 118,192 L 118,178 L 118,124 Z",
  quadriceps:
    "M 72,210 L 70,250 L 68,290 L 68,320 L 72,330 L 82,334 L 88,330 L 90,320 L 92,290 L 94,250 L 94,210 Z M 128,210 L 130,250 L 132,290 L 132,320 L 128,330 L 118,334 L 112,330 L 110,320 L 108,290 L 106,250 L 106,210 Z",
  adducteurs:
    "M 94,210 L 96,250 L 96,290 L 92,310 L 88,330 L 92,332 L 96,316 L 100,310 L 104,316 L 108,332 L 112,330 L 108,310 L 104,290 L 104,250 L 106,210 Z",
  "jambier-anterieur":
    "M 70,338 L 68,370 L 68,400 L 70,430 L 72,440 L 80,442 L 84,440 L 86,430 L 88,400 L 88,370 L 86,338 Z M 130,338 L 132,370 L 132,400 L 130,430 L 128,440 L 120,442 L 116,440 L 114,430 L 112,400 L 112,370 L 114,338 Z",
};

/* ─── Zone paths: POSTERIOR ───────────────────────────────────────────── */

const POSTERIOR_ZONES: Record<string, string> = {
  trapezes:
    "M 84,50 L 72,56 L 66,66 L 64,80 L 70,88 L 84,92 L 100,86 L 116,92 L 130,88 L 136,80 L 134,66 L 128,56 L 116,50 Z",
  deltoides:
    "M 48,66 L 44,76 L 44,92 L 50,98 L 58,92 L 62,78 L 60,66 Z M 152,66 L 156,76 L 156,92 L 150,98 L 142,92 L 138,78 L 140,66 Z",
  "grand-dorsal":
    "M 64,96 L 60,110 L 58,130 L 60,150 L 64,162 L 72,168 L 82,162 L 84,140 L 84,96 Z M 136,96 L 140,110 L 142,130 L 140,150 L 136,162 L 128,168 L 118,162 L 116,140 L 116,96 Z",
  triceps:
    "M 44,82 L 40,100 L 36,128 L 34,148 L 40,150 L 44,128 L 48,100 L 50,86 Z M 156,82 L 160,100 L 164,128 L 166,148 L 160,150 L 156,128 L 152,100 L 150,86 Z",
  "infra-epineux":
    "M 72,68 L 68,82 L 66,96 L 72,100 L 84,96 L 84,70 Z M 128,68 L 132,82 L 134,96 L 128,100 L 116,96 L 116,70 Z",
  "carre-des-lombes":
    "M 72,162 L 68,180 L 70,192 L 82,198 L 100,196 L 118,198 L 130,192 L 132,180 L 128,162 L 118,168 L 100,170 L 82,168 Z",
  "grand-fessier":
    "M 76,200 L 72,216 L 72,234 L 78,242 L 90,244 L 96,238 L 96,210 L 84,200 Z M 124,200 L 128,216 L 128,234 L 122,242 L 110,244 L 104,238 L 104,210 L 116,200 Z",
  "moyen-fessier":
    "M 66,188 L 62,200 L 64,216 L 72,222 L 76,216 L 76,200 L 74,192 Z M 134,188 L 138,200 L 136,216 L 128,222 L 124,216 L 124,200 L 126,192 Z",
  "ischio-jambiers":
    "M 72,248 L 70,280 L 68,310 L 70,330 L 78,334 L 88,332 L 92,322 L 94,290 L 94,260 L 92,248 Z M 128,248 L 130,280 L 132,310 L 130,330 L 122,334 L 112,332 L 108,322 L 106,290 L 106,260 L 108,248 Z",
  mollets:
    "M 70,338 L 68,365 L 66,395 L 68,420 L 72,440 L 80,442 L 86,440 L 88,420 L 90,395 L 90,365 L 88,338 Z M 130,338 L 132,365 L 134,395 L 132,420 L 128,440 L 120,442 L 114,440 L 112,420 L 110,395 L 110,365 L 112,338 Z",
};

/* ─── Zone label positions ────────────────────────────────────────────── */

const ANTERIOR_LABEL_POS: Record<string, [number, number]> = {
  pectoraux: [100, 95],
  biceps: [36, 112],
  "avant-bras": [28, 198],
  dentele: [55, 110],
  abdominaux: [100, 156],
  obliques: [70, 158],
  quadriceps: [80, 275],
  adducteurs: [100, 275],
  "jambier-anterieur": [78, 390],
};

const POSTERIOR_LABEL_POS: Record<string, [number, number]> = {
  trapezes: [100, 72],
  deltoides: [46, 84],
  "grand-dorsal": [72, 132],
  triceps: [40, 118],
  "infra-epineux": [78, 84],
  "carre-des-lombes": [100, 178],
  "grand-fessier": [84, 222],
  "moyen-fessier": [66, 206],
  "ischio-jambiers": [80, 290],
  mollets: [78, 390],
};

/* ─── Zone rendering helper ───────────────────────────────────────────── */

function ZonePaths({
  zones,
  labelPositions,
  selected,
  antagonist,
  hovered,
  onSelect,
  onHover,
  zoneLabels,
}: {
  zones: Record<string, string>;
  labelPositions: Record<string, [number, number]>;
  selected: string | null;
  antagonist: string | null;
  hovered: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  zoneLabels: Record<string, string>;
}) {
  return (
    <>
      {Object.entries(zones).map(([id, d]) => {
        const isActive = selected === id;
        const isAntagonist = antagonist === id;
        const isHovered = hovered === id;
        const cls = [
          "zone-path",
          isActive && "zone-path--active zone-selected",
          isAntagonist && "zone-path--antagonist",
        ]
          .filter(Boolean)
          .join(" ");

        const labelPos = labelPositions[id];
        const showLabel = isActive || isHovered;
        const labelCls = [
          "zone-label",
          isActive && "zone-label--active",
          showLabel && "zone-label--visible",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <g key={id}>
            <path
              d={d}
              className={cls}
              onClick={() => onSelect(id)}
              onMouseEnter={() => onHover(id)}
              onMouseLeave={() => onHover(null)}
              aria-label={zoneLabels[id] ?? id}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(id);
                }
              }}
            />
            {labelPos ? (
              <text x={labelPos[0]} y={labelPos[1]} className={labelCls}>
                {zoneLabels[id] ?? id}
              </text>
            ) : null}
          </g>
        );
      })}
    </>
  );
}

/* ─── Main component ──────────────────────────────────────────────────── */

export function MannequinSvg({
  face,
  selected,
  antagonist,
  hovered,
  onSelect,
  onHover,
  zoneLabels,
}: Props) {
  const zones = face === "anterior" ? ANTERIOR_ZONES : POSTERIOR_ZONES;
  const labelPositions =
    face === "anterior" ? ANTERIOR_LABEL_POS : POSTERIOR_LABEL_POS;

  return (
    <svg
      viewBox="0 0 200 480"
      xmlns="http://www.w3.org/2000/svg"
      className="anatomy-flicker"
      style={{ width: "100%", maxWidth: 320, height: "auto" }}
      aria-label={face === "anterior" ? "Anterior body view" : "Posterior body view"}
    >
      <BodyOutline />
      <ZonePaths
        zones={zones}
        labelPositions={labelPositions}
        selected={selected}
        antagonist={antagonist}
        hovered={hovered}
        onSelect={onSelect}
        onHover={onHover}
        zoneLabels={zoneLabels}
      />
    </svg>
  );
}
