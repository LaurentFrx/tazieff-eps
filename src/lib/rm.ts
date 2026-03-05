/** Epley formula: estimate 1RM from a submaximal set */
export function epley(charge: number, reps: number): number {
  if (reps <= 0 || charge <= 0) return 0;
  if (reps === 1) return charge;
  return Math.round(charge * (1 + reps / 30));
}

/** Brzycki formula: estimate 1RM from a submaximal set */
export function brzycki(charge: number, reps: number): number {
  if (reps <= 0 || charge <= 0) return 0;
  if (reps === 1) return charge;
  if (reps >= 37) return Math.round(charge * 37);
  return Math.round(charge * (36 / (37 - reps)));
}

export const RM_TABLE = [
  { pct: 100, reps: 1, zone: "force_max" },
  { pct: 90, reps: 4, zone: "force" },
  { pct: 85, reps: 6, zone: "force" },
  { pct: 80, reps: 8, zone: "volume" },
  { pct: 75, reps: 10, zone: "volume" },
  { pct: 70, reps: 12, zone: "volume" },
  { pct: 65, reps: 15, zone: "endurance" },
  { pct: 60, reps: 20, zone: "endurance" },
  { pct: 50, reps: 25, zone: "endurance_legere" },
  { pct: 30, reps: 0, zone: "puissance_vitesse" },
] as const;

/** Build the percentage table from a 1RM value */
export function buildRmTable(rm1: number) {
  return RM_TABLE.map((row) => ({
    ...row,
    charge: Math.round((row.pct / 100) * rm1),
  }));
}
