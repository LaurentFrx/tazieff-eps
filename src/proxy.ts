import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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

/* ── Host-based routing (Phase E.2.2.5) ─────────────────────────────── */
//
// Sur prof.muscu-eps.fr / design-prof.muscu-eps.fr / prof.localhost:
//   rewrite interne <path> → /prof<path>  (URL publique inchangée)
// Sur muscu-eps.fr / design.muscu-eps.fr / etc. :
//   /prof/* → /_not-found (protection croisée)
//
// Après ce bloc, les paths prof (reroutés ou non) sont DÉJÀ réécrits.
// Le bloc i18n qui suit ne tourne que pour les paths élève.

const PROF_HOSTS = new Set<string>([
  "prof.muscu-eps.fr",
  "design-prof.muscu-eps.fr",
]);

function isProfHost(host: string): boolean {
  return (
    PROF_HOSTS.has(host) ||
    host.startsWith("prof.localhost") ||
    host === "prof.localhost:3000"
  );
}

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

  // 1) Admin basic auth (prioritaire)
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const authResponse = handleAdminAuth(request);
    if (authResponse) return authResponse;
    return NextResponse.next();
  }

  // 2) Host-based routing (Phase E.2.2.5)
  {
    const onProfHost = isProfHost(host);

    // 2a. Host prof + path normal → rewrite interne vers /prof/<path>
    if (
      onProfHost &&
      !pathname.startsWith("/prof/") &&
      pathname !== "/prof"
    ) {
      const url = request.nextUrl.clone();
      url.pathname = pathname === "/" ? "/prof" : `/prof${pathname}`;
      return NextResponse.rewrite(url);
    }

    // 2b. Host élève + path /prof/* → protection croisée (404)
    if (!onProfHost && pathname.startsWith("/prof/")) {
      const url = request.nextUrl.clone();
      url.pathname = "/_not-found";
      return NextResponse.rewrite(url);
    }

    // 2c. Host prof + path déjà /prof/* → pass-through (évite double rewrite
    // et évite le i18n rewrite qui sinon préfixerait /fr/prof/...).
    if (onProfHost && pathname.startsWith("/prof")) {
      return NextResponse.next();
    }
  }

  // 3) i18n locale rewrite (espace élève uniquement, pas de /prof/*)
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
