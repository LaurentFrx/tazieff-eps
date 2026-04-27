/**
 * Build a locale-aware path.
 *
 * P0.7-octies — Préfixe TOUJOURS avec la nouvelle locale, y compris pour
 * fr. Avant : `/reglages` quand newLocale === "fr". Sur le miroir admin
 * (admin.muscu-eps.fr / design-admin.muscu-eps.fr), `/reglages` sans
 * préfixe locale n'a pas de route correspondante → 404. Sur l'élève le
 * middleware réécrit en interne, donc le bug ne se voyait pas, mais la
 * cohérence avec LocaleLink (post P0.7-quater) impose le préfixe partout.
 */
export function buildLocalePath(
  currentPath: string,
  newLocale: string,
): string {
  const pathWithoutLocale = currentPath.replace(
    /^\/(fr|en|es)(\/|$)/,
    "/",
  );
  const cleanPath = pathWithoutLocale || "/";
  return `/${newLocale}${cleanPath === "/" ? "" : cleanPath}` || `/${newLocale}`;
}
