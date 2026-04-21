// Phase B.1.4 — shared UI utilities for the teacher override editor.
// Extracted from ExerciseLiveDetail.tsx so the parent (buildOverrideDoc
// and other local needs) and the useOverrideUI hook can both use them.

import type {
  ExerciseLiveBulletsBlock,
  ExerciseLiveMarkdownBlock,
  ExerciseLiveMediaBlock,
} from "@/lib/live/types";

export function createSectionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `section-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function moveItem<T>(items: T[], from: number, to: number) {
  if (from < 0 || from >= items.length || to < 0 || to >= items.length) {
    return items;
  }
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function createMarkdownBlock(
  content = "",
): ExerciseLiveMarkdownBlock {
  return { type: "markdown", content };
}

export function createBulletsBlock(
  items: string[] = [""],
): ExerciseLiveBulletsBlock {
  return { type: "bullets", items };
}

export function createMediaBlock(): ExerciseLiveMediaBlock {
  return { type: "media", mediaType: "link", url: "", caption: "" };
}

export function createBlock(type: "markdown" | "bullets" | "media") {
  if (type === "bullets") {
    return createBulletsBlock();
  }
  if (type === "media") {
    return createMediaBlock();
  }
  return createMarkdownBlock();
}
