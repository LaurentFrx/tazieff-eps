import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAdminHost, isProfHost } from "@/lib/admin-hosts";

/* ── Admin basic auth ────────────────────────────────────────────────── */

const BASIC_AUTH_ENV = process.env.ADMIN_BASIC_AUTH;

function unauthorized() {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Admin"',
    },
  });
}

function handleAdminAuth(request: NextRequest): NextResponse | null {
  if (!BASIC_AUTH_ENV) return null;

  const authHeader = request.headers.get("authorization");
  if (!authHeader) return unauthorized();

  const [scheme, encoded] = authHeader.split(" ");
  if (scheme !== "Basic" || !encoded) return unauthorized();

  let decoded = "";
  try {
    decoded = atob(encoded);
  } catch {
    return unauthorized();
  }

  if (decoded !== BASIC_AUTH_ENV) return unauthorized();
  return null; // auth OK
}

/* ── Host-based routing (Phase E.2.2.5 + P0.7) ───────────────────────── */
//
// Sur prof.muscu-eps.fr / design-prof.muscu-eps.fr / prof.localhost :
//   rewrite interne <path> → /prof<path>  (URL publique inchangée)
// Sur admin.muscu-eps.fr / design-admin.muscu-eps.fr / admin.localhost (P0.7) :
//   rewrite interne <path> → /admin<path>
// Sur muscu-eps.fr / design.muscu-eps.fr / etc. :
//   /prof/* et /admin/* → /_not-found (protection croisée)
//
// Après ce bloc, les paths prof / admin (reroutés ou non) sont DÉJÀ
// réécrits. Le bloc i18n qui suit ne tourne que pour les paths élève.

// ADMIN_HOSTS / PROF_HOSTS / isAdminHost / isProfHost partagés avec le
// layout [locale] (P0.7-septies) via src/lib/admin-hosts.ts.

function shouldSkipHostRouting(pathname: string): boolean {
  // Assets, API, auth Supabase callback, GitHub OAuth callback :
  // globaux aux deux sous-domaines, pass-through.
  return (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/callback") ||
    pathname.includes(".")
  );
}

/* ── P0.7-bis : pass-through admin (miroir d'édition) ────────────────── */
//
// Liste des paths qui NE sont PAS rewritées vers /admin/<path> sur le
// sous-domaine admin. Le contenu standard de l'app est servi à la place,
// avec la session admin active (donc édition au clic visible).
//
// Routes EXCLUES de la liste (continuent à rewrite vers /admin/<path>) :
//   - /ma-classe : espace élève, ne doit pas être miroité côté admin
//   - /enseignant : outil local élève, idem
//
// /_next, /api/*, fichiers avec extension : déjà gérés par
// shouldSkipHostRouting() en amont (étape 0). Listés ici pour redondance
// défensive et clarté.

const ADMIN_MIRROR_PREFIXES = [
  "/exercices",
  "/methodes",
  "/bac",
  "/learn",
  "/api/teacher",
  "/api/me",
  "/api/exercises",
  "/api/auth",
  "/_next",
  "/favicon",
  "/robots",
  "/sitemap",
  "/manifest",
  "/icons",
  "/images",
];

const LOCALE_PREFIXES = ["/fr", "/en", "/es"] as const;

// P0.7-ter — Les routes pédagogiques de l'app sont localisées
// (/fr/exercices, /en/exercices, /es/exercices). Pour que le miroir admin
// reconnaisse ces chemins comme pass-through, on retire le préfixe locale
// avant de tester contre la liste. Les routes /api/* ne sont jamais
// localisées en Next.js, donc ce strip est sans effet sur elles.
function stripLocalePrefix(pathname: string): string {
  for (const prefix of LOCALE_PREFIXES) {
    if (pathname === prefix) return "/";
    if (pathname.startsWith(`${prefix}/`)) {
      return pathname.slice(prefix.length);
    }
  }
  return pathname;
}

function isAdminMirrorPath(pathname: string): boolean {
  const delocalized = stripLocalePrefix(pathname);
  return ADMIN_MIRROR_PREFIXES.some(
    (prefix) =>
      delocalized === prefix || delocalized.startsWith(`${prefix}/`),
  );
}

/* ── i18n locale rewrite ─────────────────────────────────────────────── */

const LOCALES = ["fr", "en", "es"];

/* ── Main proxy ──────────────────────────────────────────────────────── */

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") ?? "";

  // 0) Early pass-through pour assets / API / auth. Le matcher Next.js les
  // exclut déjà en prod, mais on garde cette garde défensive pour robustesse
  // (tests unitaires appelant proxy() directement, et safety net si le
  // matcher était trop permissif un jour).
  if (shouldSkipHostRouting(pathname)) {
    return NextResponse.next();
  }

  // 1) Host-based routing — admin (P0.7 + P0.7-bis)
  //
  // Sur admin.muscu-eps.fr / design-admin / admin.localhost :
  //   - Routes pédagogiques (PASS_THROUGH_PATHS) : pass-through, le contenu
  //     standard de l'app est servi avec la session admin active. C'est le
  //     "miroir d'édition" introduit en P0.7-bis pour permettre au super_admin
  //     de consulter les fiches et d'éditer au clic sans avoir à passer sur
  //     muscu-eps.fr (cookies de session isolés par host, cf E.2.3.8).
  //   - Routes natives /admin/* (login + home) et autres paths inconnus :
  //     rewrite vers /admin/<path> (comportement P0.7).
  //   - Routes /ma-classe, /enseignant : rewritées vers /admin/<path>
  //     (rejet implicite — ces espaces appartiennent à l'élève, pas au
  //     miroir admin).
  //
  // Sur muscu-eps.fr / design.muscu-eps.fr / autres :
  //   - Path /admin/* : protection croisée (404).
  {
    const onAdminHost = isAdminHost(host);

    // 1a. Host admin + path pédagogique → pass-through (miroir d'édition).
    //     NB : /_next/* et /api/* sont déjà attrapés par shouldSkipHostRouting
    //     en amont. Cette liste est faite pour les paths utilisateurs.
    if (onAdminHost && isAdminMirrorPath(pathname)) {
      return NextResponse.next();
    }

    // 1b. Host admin + path normal → rewrite interne vers /admin/<path>
    if (
      onAdminHost &&
      !pathname.startsWith("/admin/") &&
      pathname !== "/admin"
    ) {
      const url = request.nextUrl.clone();
      url.pathname = pathname === "/" ? "/admin" : `/admin${pathname}`;
      return NextResponse.rewrite(url);
    }

    // 1c. Host non-admin + path /admin/* → protection croisée (404)
    //     (NB : le Basic Auth historique ci-dessous n'est plus déclenché
    //      en prod car ce bloc le précède, sauf si ADMIN_BASIC_AUTH est
    //      utilisé sur localhost en dev — conservé pour rétrocompat.)
    if (!onAdminHost && pathname.startsWith("/admin/")) {
      const url = request.nextUrl.clone();
      url.pathname = "/_not-found";
      return NextResponse.rewrite(url);
    }

    // 1d. Host admin + path déjà /admin/* → pass-through
    if (onAdminHost && (pathname === "/admin" || pathname.startsWith("/admin/"))) {
      return NextResponse.next();
    }
  }

  // 2) Admin basic auth (rétrocompat dev). Inopérant en prod après le bloc 1.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const authResponse = handleAdminAuth(request);
    if (authResponse) return authResponse;
    return NextResponse.next();
  }

  // 3) Host-based routing — prof (Phase E.2.2.5)
  {
    const onProfHost = isProfHost(host);

    // 3a. Host prof + path normal → rewrite interne vers /prof/<path>
    if (
      onProfHost &&
      !pathname.startsWith("/prof/") &&
      pathname !== "/prof"
    ) {
      const url = request.nextUrl.clone();
      url.pathname = pathname === "/" ? "/prof" : `/prof${pathname}`;
      return NextResponse.rewrite(url);
    }

    // 3b. Host élève + path /prof/* → protection croisée (404)
    if (!onProfHost && pathname.startsWith("/prof/")) {
      const url = request.nextUrl.clone();
      url.pathname = "/_not-found";
      return NextResponse.rewrite(url);
    }

    // 3c. Host prof + path déjà /prof/* → pass-through (évite double rewrite
    // et évite le i18n rewrite qui sinon préfixerait /fr/prof/...).
    if (onProfHost && pathname.startsWith("/prof")) {
      return NextResponse.next();
    }
  }

  // 4) i18n locale rewrite (espace élève uniquement, pas de /prof/* ni /admin/*)
  // Skip si déjà préfixé par une locale
  const pathnameHasLocale = LOCALES.some(
    (locale) =>
      pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );
  if (pathnameHasLocale) return NextResponse.next();

  // Rewrite unprefixed paths to /fr/...
  const url = request.nextUrl.clone();
  url.pathname = `/fr${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/((?!_next|api|auth|callback|legal|images|models|fonts|media|manifest\\.webmanifest|sw\\.js|swe-worker|favicon\\.ico|favicon-16\\.png|favicon-32\\.png|apple-touch-icon\\.png|.*\\..*)..+)",
  ],
};
