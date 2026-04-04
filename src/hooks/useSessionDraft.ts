"use client";

import { useCallback, useSyncExternalStore } from "react";

export interface SessionDraftItem {
  slug: string;
  title: string;
  muscles: string[];
  addedAt: string;
}

const STORAGE_KEY = "eps_session_draft";

let snapshot: SessionDraftItem[] = [];
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function readStorage(): SessionDraftItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SessionDraftItem[]) : [];
  } catch {
    return [];
  }
}

function writeStorage(items: SessionDraftItem[]) {
  snapshot = items;
  try {
    if (items.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  } catch { /* quota exceeded */ }
  notify();
}

// Init from storage on first access
if (typeof window !== "undefined") {
  snapshot = readStorage();
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) {
      snapshot = readStorage();
      notify();
    }
  });
}

function getSnapshot(): SessionDraftItem[] {
  return snapshot;
}

const SERVER_SNAPSHOT: SessionDraftItem[] = [];
function getServerSnapshot(): SessionDraftItem[] {
  return SERVER_SNAPSHOT;
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useSessionDraft() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const addItem = useCallback((exercise: { slug: string; title: string; muscles: string[] }) => {
    const current = readStorage();
    if (current.some((i) => i.slug === exercise.slug)) return;
    writeStorage([...current, { ...exercise, addedAt: new Date().toISOString() }]);
  }, []);

  const removeItem = useCallback((slug: string) => {
    writeStorage(readStorage().filter((i) => i.slug !== slug));
  }, []);

  const clearAll = useCallback(() => {
    writeStorage([]);
  }, []);

  const isInDraft = useCallback(
    (slug: string) => items.some((i) => i.slug === slug),
    [items],
  );

  return { items, addItem, removeItem, clearAll, isInDraft };
}
