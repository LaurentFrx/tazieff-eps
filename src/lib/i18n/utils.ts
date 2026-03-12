/**
 * Traverse a nested object by dot-separated key path.
 * Returns the string value if found, null otherwise.
 */
export function getNestedValue(
  source: Record<string, unknown>,
  key: string,
): string | null {
  const parts = key.split(".");
  let value: unknown = source;

  for (const part of parts) {
    if (typeof value !== "object" || value === null) {
      return null;
    }

    value = (value as Record<string, unknown>)[part];
  }

  return typeof value === "string" ? value : null;
}
