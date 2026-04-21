// Phase B.1.3 — shared pill utilities for the teacher override editor.
// Extracted from ExerciseLiveDetail.tsx so parent (pillState memo + JSX modal),
// useOverrideSave (saveMeta deps), and usePillDropdown hook can all share them.

export const DROPDOWN_MAX_HEIGHT = 288;

export function getLevelDefaults(t: (key: string) => string) {
  return [
    t("difficulty.debutant"),
    t("difficulty.intermediaire"),
    t("difficulty.avance"),
  ];
}

export function getTypeDefaults(t: (key: string) => string) {
  return [
    t("exerciseEditor.types.fondamentaux"),
    t("exerciseEditor.types.technique"),
    t("exerciseEditor.types.renforcement"),
    t("exerciseEditor.types.gainage"),
    t("exerciseEditor.types.mobilite"),
    t("exerciseEditor.types.souplesse"),
    t("exerciseEditor.types.pliometrie"),
    t("exerciseEditor.types.enduranceDeForce"),
    t("exerciseEditor.types.puissance"),
    t("exerciseEditor.types.hypertrophie"),
    t("exerciseEditor.types.echauffement"),
    t("exerciseEditor.types.retourAuCalme"),
  ];
}

export function getMuscleDefaults(t: (key: string) => string) {
  return [
    t("exerciseEditor.muscleNames.abdominaux"),
    t("exerciseEditor.muscleNames.transverse"),
    t("exerciseEditor.muscleNames.obliques"),
    t("exerciseEditor.muscleNames.dos"),
    t("exerciseEditor.muscleNames.pectoraux"),
    t("exerciseEditor.muscleNames.epaules"),
    t("exerciseEditor.muscleNames.biceps"),
    t("exerciseEditor.muscleNames.triceps"),
    t("exerciseEditor.muscleNames.fessiers"),
    t("exerciseEditor.muscleNames.quadriceps"),
    t("exerciseEditor.muscleNames.ischiojambiers"),
    t("exerciseEditor.muscleNames.mollets"),
    t("exerciseEditor.muscleNames.lombaires"),
  ];
}

export function getThemeDefaults(t: (key: string) => string) {
  return [
    "AFL1",
    "AFL2",
    "AFL3",
    t("exerciseEditor.themeTags.securite"),
    t("exerciseEditor.themeTags.methode"),
    t("exerciseEditor.themeTags.technique"),
  ];
}

export function normalizeLabel(value: string) {
  return value.trim();
}

export function normalizeKey(value: string) {
  return value.trim().toLowerCase();
}

export function uniqueLabels(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const normalized = normalizeLabel(value);
    if (!normalized) {
      continue;
    }
    const key = normalizeKey(normalized);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(normalized);
  }
  return result;
}

export function sortLabels(values: string[]) {
  return [...values].sort((a, b) =>
    a.localeCompare(b, "fr", { sensitivity: "base" }),
  );
}

export function filterOptions(options: string[], query: string) {
  const key = normalizeKey(query);
  if (!key) {
    return options;
  }
  return options.filter((option) => normalizeKey(option).includes(key));
}

export function optionExists(options: string[], value: string) {
  const key = normalizeKey(value);
  if (!key) {
    return false;
  }
  return options.some((option) => normalizeKey(option) === key);
}
