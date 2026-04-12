/**
 * Navigation mode store (localStorage).
 * "guide" = linear guided path, "libre" = free navigation.
 */

export type NavMode = "guide" | "libre";

const MODE_KEY = "eps_nav_mode";
const PROGRESS_KEY = "eps_guide_progress";

/* ── Mode ─────────────────────────────────────────────────────────── */

export function getNavMode(): NavMode | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(MODE_KEY);
  return v === "guide" || v === "libre" ? v : null;
}

export function setNavMode(mode: NavMode) {
  localStorage.setItem(MODE_KEY, mode);
}

/* ── Guided progress ──────────────────────────────────────────────── */

/** Session IDs in order */
export const SESSION_ORDER = ["s1", "s2", "s3", "s4", "s5", "s6"] as const;

export type GuidedProgress = {
  /** Set of exercise slugs the user has visited */
  visited: string[];
  /** Completed session IDs */
  completed: string[];
};

const DEFAULT_PROGRESS: GuidedProgress = { visited: [], completed: [] };

export function getGuidedProgress(): GuidedProgress {
  if (typeof window === "undefined") return DEFAULT_PROGRESS;
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw);
    return {
      visited: Array.isArray(parsed.visited) ? parsed.visited : [],
      completed: Array.isArray(parsed.completed) ? parsed.completed : [],
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export function saveGuidedProgress(progress: GuidedProgress) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

export function markExerciseVisited(slug: string) {
  const p = getGuidedProgress();
  if (!p.visited.includes(slug)) {
    p.visited.push(slug);
    saveGuidedProgress(p);
  }
}

export function markSessionCompleted(sessionId: string) {
  const p = getGuidedProgress();
  if (!p.completed.includes(sessionId)) {
    p.completed.push(sessionId);
    saveGuidedProgress(p);
  }
}

/** Check if a session is unlocked (first session always unlocked, others need previous completed) */
export function isSessionUnlocked(sessionId: string, progress: GuidedProgress): boolean {
  const idx = SESSION_ORDER.indexOf(sessionId as typeof SESSION_ORDER[number]);
  if (idx <= 0) return true;
  return progress.completed.includes(SESSION_ORDER[idx - 1]);
}

/** Count visited exercises for a session prefix */
export function getSessionVisitedCount(sessionPrefix: string, progress: GuidedProgress): number {
  return progress.visited.filter((slug) => slug.startsWith(sessionPrefix + "-")).length;
}
