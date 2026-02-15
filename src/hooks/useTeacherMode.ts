import { useCallback, useSyncExternalStore } from "react";

export type TeacherModeSnapshot = {
  unlocked: boolean;
  pin: string;
};

const DEFAULT: TeacherModeSnapshot = Object.freeze({ unlocked: false, pin: "" });
const SERVER_SNAPSHOT: TeacherModeSnapshot = DEFAULT;
const EVENT_NAME = "teacherModeChange";

const listeners = new Set<() => void>();

let cached: TeacherModeSnapshot = DEFAULT;

function emit() {
  // Invalidate cache so next getSnapshot returns fresh data
  cached = buildSnapshot();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  }
  for (const fn of listeners) {
    fn();
  }
}

function buildSnapshot(): TeacherModeSnapshot {
  if (typeof window === "undefined") {
    return DEFAULT;
  }
  const raw = window.__teacherMode;
  if (!raw) {
    return DEFAULT;
  }
  const unlocked = Boolean(raw.unlocked);
  const pin = raw.pin ?? "";
  // Return cached reference if values haven't changed
  if (cached.unlocked === unlocked && cached.pin === pin) {
    return cached;
  }
  return Object.freeze({ unlocked, pin });
}

function getSnapshot(): TeacherModeSnapshot {
  const next = buildSnapshot();
  if (next !== cached) {
    cached = next;
  }
  return cached;
}

function getServerSnapshot(): TeacherModeSnapshot {
  return SERVER_SNAPSHOT;
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);

  const onEvent = () => callback();
  if (typeof window !== "undefined") {
    window.addEventListener(EVENT_NAME, onEvent);
  }

  return () => {
    listeners.delete(callback);
    if (typeof window !== "undefined") {
      window.removeEventListener(EVENT_NAME, onEvent);
    }
  };
}

export type UseTeacherModeReturn = {
  unlocked: boolean;
  pin: string;
  unlock: (pin: string) => void;
  lock: () => void;
};

declare global {
  interface Window {
    __teacherMode?: TeacherModeSnapshot;
  }
}

export function useTeacherMode(): UseTeacherModeReturn {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const unlock = useCallback((pin: string) => {
    if (typeof window === "undefined") return;
    window.__teacherMode = { unlocked: true, pin };
    emit();
  }, []);

  const lock = useCallback(() => {
    if (typeof window === "undefined") return;
    window.__teacherMode = { unlocked: false, pin: "" };
    emit();
  }, []);

  return {
    unlocked: snapshot.unlocked,
    pin: snapshot.pin,
    unlock,
    lock,
  };
}

// Exported for testing
export { getSnapshot as _getSnapshot, subscribe as _subscribe, emit as _emit };
