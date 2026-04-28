// Sprint A1 — getAdminLoginUrl déléguée à resolveEnv() (source unique).
//
// Avant (P0.7-decies) : helper inline avec détection runtime via
// window.location.host. Le code dupliquait sans le savoir l'équivalent
// côté prof (reglages/page.tsx) et côté élève (ProLoginForm), avec des
// couvertures différentes (admin couvrait le dev, les autres pas).
//
// Maintenant : tous les helpers passent par resolveEnv(). Cf src/lib/env.ts.

import { resolveEnv } from "./env";

export function getAdminLoginUrl(): string {
  return `${resolveEnv().baseUrl.admin}/login`;
}
