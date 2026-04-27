// Sprint P0.7-decies — URL du login admin selon l'environnement courant.
//
// Calque sur getTeacherLoginUrl dans [locale]/reglages/page.tsx :
// détection au runtime via window.location.host pour rester cohérent
// avec preview/prod/local sans configurer de variable d'env publique.
//
// Pas de hardcode dans les composants : tout caller doit passer par
// getAdminLoginUrl().

export function getAdminLoginUrl(): string {
  // SSR / pre-render : on retombe sur la prod par défaut.
  if (typeof window === "undefined") {
    return "https://admin.muscu-eps.fr/login";
  }
  const host = window.location.host;
  // Preview Vercel pour la branche redesign (alias DNS configuré).
  if (host === "design.muscu-eps.fr") {
    return "https://design-admin.muscu-eps.fr/login";
  }
  // Dev local : convention admin.localhost:<port> (cf. proxy.ts).
  if (host.startsWith("localhost") || host.startsWith("127.0.0.1")) {
    const port = host.includes(":") ? host.split(":")[1] : "3000";
    return `http://admin.localhost:${port}/login`;
  }
  // Prod par défaut.
  return "https://admin.muscu-eps.fr/login";
}
