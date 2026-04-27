// Sprint P0.7-septies — Liste partagée des sous-domaines admin / prof.
//
// Source unique de vérité pour la détection du host. Importée par :
//   - src/proxy.ts (routage host-based)
//   - src/app/[locale]/layout.tsx (désactivation anonymous fallback)
//
// Pas de logique d'environnement ici : le runtime edge du proxy et le
// runtime nodejs du layout doivent pouvoir l'importer.

export const ADMIN_HOSTS = new Set<string>([
  "admin.muscu-eps.fr",
  "design-admin.muscu-eps.fr",
]);

export const PROF_HOSTS = new Set<string>([
  "prof.muscu-eps.fr",
  "design-prof.muscu-eps.fr",
]);

export function isAdminHost(host: string): boolean {
  return (
    ADMIN_HOSTS.has(host) ||
    host.startsWith("admin.localhost") ||
    host === "admin.localhost:3000"
  );
}

export function isProfHost(host: string): boolean {
  return (
    PROF_HOSTS.has(host) ||
    host.startsWith("prof.localhost") ||
    host === "prof.localhost:3000"
  );
}
