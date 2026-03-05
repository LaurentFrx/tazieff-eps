import { describe, it, expect } from "vitest";
import { messages, type Lang } from "./messages";

/** Recursively collect all leaf keys from an object as dot-paths */
function collectKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      keys.push(...collectKeys(value as Record<string, unknown>, path));
    } else {
      keys.push(path);
    }
  }
  return keys;
}

const frKeys = collectKeys(messages.fr);
const enKeys = collectKeys(messages.en);
const esKeys = collectKeys(messages.es);

describe("i18n completeness", () => {
  it("FR has a substantial number of keys", () => {
    expect(frKeys.length).toBeGreaterThan(200);
  });

  it("EN has all FR keys", () => {
    const missing = frKeys.filter((k) => !enKeys.includes(k));
    expect(missing).toEqual([]);
  });

  it("ES has all FR keys", () => {
    const missing = frKeys.filter((k) => !esKeys.includes(k));
    expect(missing).toEqual([]);
  });

  it("EN has no extra keys beyond FR", () => {
    const extra = enKeys.filter((k) => !frKeys.includes(k));
    expect(extra).toEqual([]);
  });

  it("ES has no extra keys beyond FR", () => {
    const extra = esKeys.filter((k) => !frKeys.includes(k));
    expect(extra).toEqual([]);
  });

  it("no FR key has an empty string value", () => {
    function checkEmpty(obj: Record<string, unknown>, path = ""): string[] {
      const empties: string[] = [];
      for (const [key, value] of Object.entries(obj)) {
        const fullPath = path ? `${path}.${key}` : key;
        if (typeof value === "string" && value.trim() === "") {
          empties.push(fullPath);
        } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
          empties.push(...checkEmpty(value as Record<string, unknown>, fullPath));
        }
      }
      return empties;
    }

    for (const lang of ["fr", "en", "es"] as Lang[]) {
      const empties = checkEmpty(messages[lang] as unknown as Record<string, unknown>);
      expect(empties, `Empty keys in ${lang}`).toEqual([]);
    }
  });
});
