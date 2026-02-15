import type { Difficulty, ExerciseFrontmatter } from "@/lib/content/schema";
import type { LiveExerciseListItem, LiveExerciseRow } from "@/lib/live/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ExerciseStatus = "draft" | "ready";

export type ExerciseListItem = LiveExerciseListItem & {
  status?: ExerciseStatus;
};

export type FilterCriteria = {
  query?: string;
  levels?: Difficulty[];
  equipment?: string[];
  tags?: string[];
  themes?: (1 | 2 | 3)[];
  onlyFavorites?: boolean;
  favorites?: string[];
};

export const NO_EQUIPMENT_ID = "sans-materiel";

// ---------------------------------------------------------------------------
// mergeExercises – combine MDX items with live Supabase rows
// ---------------------------------------------------------------------------

export function mergeExercises(
  exercises: LiveExerciseListItem[],
  liveExercises: LiveExerciseRow[],
): ExerciseListItem[] {
  if (liveExercises.length === 0) {
    return exercises;
  }

  const mdxItems = exercises.filter((exercise) => !exercise.isLive);
  const existing = new Set(mdxItems.map((exercise) => exercise.slug));
  const liveItems: ExerciseListItem[] = liveExercises
    .map((row) => {
      const dataJson = row.data_json as LiveExerciseRow["data_json"] & {
        status?: ExerciseStatus;
      };
      return {
        ...dataJson.frontmatter,
        slug: row.slug,
        isLive: true,
        status: dataJson.status,
      };
    })
    .filter((exercise) => !existing.has(exercise.slug));

  return ([...mdxItems, ...liveItems] as ExerciseListItem[]).sort((a, b) => {
    const statusA = a.status ?? "ready";
    const statusB = b.status ?? "ready";
    if (statusA !== statusB) {
      return statusA === "draft" ? 1 : -1;
    }
    return a.title.localeCompare(b.title, "fr");
  });
}

// ---------------------------------------------------------------------------
// filterVisibleExercises – hide drafts for non-teachers
// ---------------------------------------------------------------------------

export function filterVisibleExercises(
  exercises: ExerciseListItem[],
  teacherUnlocked: boolean,
): ExerciseListItem[] {
  if (teacherUnlocked) {
    return exercises;
  }
  return exercises.filter((exercise) => exercise.status !== "draft");
}

// ---------------------------------------------------------------------------
// filterExercises – apply all user-facing filters
// ---------------------------------------------------------------------------

export function filterExercises(
  exercises: ExerciseListItem[],
  criteria: FilterCriteria,
): ExerciseListItem[] {
  const {
    query = "",
    levels = [],
    equipment = [],
    tags = [],
    themes = [],
    onlyFavorites = false,
    favorites = [],
  } = criteria;

  const normalizedQuery = query.trim().toLowerCase();
  const selectedHasNoEquipment = equipment.includes(NO_EQUIPMENT_ID);
  const selectedEquipmentValues = equipment.filter(
    (item) => item !== NO_EQUIPMENT_ID,
  );

  return exercises.filter((exercise) => {
    // Favorites filter
    if (onlyFavorites && !favorites.includes(exercise.slug)) {
      return false;
    }

    // Level filter
    if (levels.length > 0) {
      if (!exercise.level || !levels.includes(exercise.level)) {
        return false;
      }
    }

    // Equipment filter
    if (equipment.length > 0) {
      const exEquipments = (exercise.equipment ?? [])
        .map((item) => item?.trim())
        .filter((item): item is string => Boolean(item));
      const isNoEquipment = exEquipments.length === 0;
      const hasSelectedEquipment =
        selectedEquipmentValues.length > 0 &&
        exEquipments.some((item) => selectedEquipmentValues.includes(item));
      const matches =
        (selectedHasNoEquipment && isNoEquipment) || hasSelectedEquipment;
      if (!matches) {
        return false;
      }
    }

    // Tags filter
    if (tags.length > 0) {
      const hasTag = tags.some((tag) => exercise.tags.includes(tag));
      if (!hasTag) {
        return false;
      }
    }

    // Themes filter
    if (themes.length > 0) {
      const compat = exercise.themeCompatibility ?? [];
      if (compat.length === 0) {
        return false;
      }
      const hasTheme = themes.some((item) => compat.includes(item));
      if (!hasTheme) {
        return false;
      }
    }

    // Text search
    if (normalizedQuery) {
      const haystack =
        `${exercise.title} ${exercise.tags.join(" ")} ${exercise.muscles.join(" ")}`.toLowerCase();
      if (!haystack.includes(normalizedQuery)) {
        return false;
      }
    }

    return true;
  });
}
