/**
 * Build a locale-aware path.
 * FR paths have no prefix: /exercices
 * EN/ES paths are prefixed: /en/exercices, /es/exercices
 */
export function buildLocalePath(
  currentPath: string,
  newLocale: string,
): string {
  // Remove existing locale prefix if present
  const pathWithoutLocale = currentPath.replace(
    /^\/(fr|en|es)(\/|$)/,
    "/",
  );
  const cleanPath = pathWithoutLocale || "/";
  if (newLocale === "fr") return cleanPath;
  return `/${newLocale}${cleanPath === "/" ? "" : cleanPath}` || `/${newLocale}`;
}
