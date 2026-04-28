// Sprint A1 — Source unique de vérité pour la résolution d'environnement
// et des hosts par sous-domaine.
//
// Cause racine traitée (audit-cc 2026-04-28 PS1+PS6+PS7) : 4 helpers inline
// divergents (getAdminLoginUrl, getStudentSiteUrl, getTeacherLoginUrl, et
// l'inline d'EnseignantMovedClient) répondaient à la même question avec des
// couvertures différentes (admin couvre dev, les autres pas). Cette fonction
// centralise tout : prod / preview / dev × élève / prof / admin.
//
// Référence : GOUVERNANCE_EDITORIALE.md §2.1, §7.

export type AppEnv = "production" | "preview" | "development";

export type AppRole = "eleve" | "prof" | "admin";

export type ResolvedEnv = {
  env: AppEnv;
  hosts: Record<AppRole, string>;
  baseUrl: Record<AppRole, string>;
};

/* ── Hosts canoniques par environnement ──────────────────────────────── */

const PROD_HOSTS = {
  eleve: "muscu-eps.fr",
  prof: "prof.muscu-eps.fr",
  admin: "admin.muscu-eps.fr",
} as const;

const PREVIEW_HOSTS = {
  eleve: "design.muscu-eps.fr",
  prof: "design-prof.muscu-eps.fr",
  admin: "design-admin.muscu-eps.fr",
} as const;

const DEV_DEFAULT_PORT = "3000";

function devHosts(port: string): Record<AppRole, string> {
  return {
    eleve: `localhost:${port}`,
    prof: `prof.localhost:${port}`,
    admin: `admin.localhost:${port}`,
  };
}

/* ── Détection d'environnement ───────────────────────────────────────── */

/**
 * Détecte l'environnement à partir d'un host courant. Utilisé côté client
 * (window.location.host) ou côté serveur si on a déjà extrait le host.
 */
function detectEnvFromHost(host: string): AppEnv {
  // Local dev : tout host contenant localhost ou 127.0.0.1.
  if (host.includes("localhost") || host.startsWith("127.0.0.1")) {
    return "development";
  }
  // Preview Vercel : tous les sous-domaines design-*.muscu-eps.fr.
  if (host === PREVIEW_HOSTS.eleve) return "preview";
  if (host === PREVIEW_HOSTS.prof) return "preview";
  if (host === PREVIEW_HOSTS.admin) return "preview";
  // Prod par défaut.
  return "production";
}

/**
 * Côté serveur : on lit VERCEL_ENV (production/preview) puis NODE_ENV.
 * Côté client : on déduit du host courant.
 *
 * Note : VERCEL_ENV vaut "production" sur l'environnement de prod Vercel,
 * "preview" pour les déploiements de preview/branches, et undefined hors
 * Vercel (dev local notamment).
 */
function detectEnv(): AppEnv {
  if (typeof window !== "undefined") {
    return detectEnvFromHost(window.location.host);
  }
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv === "production") return "production";
  if (vercelEnv === "preview") return "preview";
  if (process.env.NODE_ENV === "production") return "production";
  return "development";
}

/* ── API publique ────────────────────────────────────────────────────── */

/**
 * Extrait le port à partir d'un host de la forme `host:port`. Retourne le
 * port par défaut si le host n'en contient pas. Utilisé pour propager le
 * port courant aux liens prof.localhost / admin.localhost en dev.
 */
function extractPort(host: string): string {
  if (host.includes(":")) {
    const port = host.split(":")[1];
    if (port && port.length > 0) return port;
  }
  return DEV_DEFAULT_PORT;
}

/**
 * Source unique de vérité pour les URLs inter-sous-domaines.
 *
 * Côté client : le port en dev est extrait de `window.location.host` pour
 * suivre le port du serveur en cours d'exécution. Côté serveur : on retombe
 * sur le port par défaut (3000), car le port côté SSR n'est pas toujours
 * exposé de façon fiable et ce path n'est appelé qu'en SSG / pre-render.
 */
export function resolveEnv(): ResolvedEnv {
  const env = detectEnv();

  let hosts: Record<AppRole, string>;
  if (env === "production") {
    hosts = { ...PROD_HOSTS };
  } else if (env === "preview") {
    hosts = { ...PREVIEW_HOSTS };
  } else {
    const port =
      typeof window !== "undefined"
        ? extractPort(window.location.host)
        : DEV_DEFAULT_PORT;
    hosts = devHosts(port);
  }

  const protocol = env === "development" ? "http" : "https";
  const baseUrl: Record<AppRole, string> = {
    eleve: `${protocol}://${hosts.eleve}`,
    prof: `${protocol}://${hosts.prof}`,
    admin: `${protocol}://${hosts.admin}`,
  };

  return { env, hosts, baseUrl };
}
