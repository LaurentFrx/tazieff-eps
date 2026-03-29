import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/* ── Admin Basic Auth ────────────────────────────────────────────────── */

const BASIC_AUTH_ENV = process.env.ADMIN_BASIC_AUTH;

function unauthorized() {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Admin"',
    },
  });
}

/* ── i18n locale rewrite ─────────────────────────────────────────────── */

const COOKIE_KEY = "eps_lang";
const DEFAULT_LOCALE = "fr";
const SUPPORTED_LOCALES = ["fr", "en", "es"];

function isValidLocale(value: string): boolean {
  return SUPPORTED_LOCALES.includes(value);
}

/**
 * Returns true if the path should NOT receive a locale prefix.
 * Static assets, API routes, admin, and files with extensions are excluded.
 */
function shouldSkipLocale(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/models") ||
    pathname.startsWith("/fonts") ||
    pathname.startsWith("/branding") ||
    pathname.startsWith("/admin") ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/sw.js" ||
    pathname === "/favicon.ico" ||
    // Files with extensions (static assets)
    /\.\w{2,5}$/.test(pathname)
  );
}

/* ── Proxy entry point ───────────────────────────────────────────────── */

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Admin auth check
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!BASIC_AUTH_ENV) {
      return NextResponse.next();
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return unauthorized();
    }

    const [scheme, encoded] = authHeader.split(" ");
    if (scheme !== "Basic" || !encoded) {
      return unauthorized();
    }

    let decoded = "";
    try {
      decoded = atob(encoded);
    } catch {
      return unauthorized();
    }

    if (decoded !== BASIC_AUTH_ENV) {
      return unauthorized();
    }

    return NextResponse.next();
  }

  // 2. i18n locale rewrite — skip static assets and API routes
  if (shouldSkipLocale(pathname)) {
    return NextResponse.next();
  }

  // Already prefixed with a locale (internal rewrite destination)
  const firstSegment = pathname.split("/")[1];
  if (SUPPORTED_LOCALES.includes(firstSegment)) {
    return NextResponse.next();
  }

  // Read locale from cookie, default to 'fr'
  const rawCookie = request.cookies.get(COOKIE_KEY)?.value;
  const locale =
    rawCookie && isValidLocale(rawCookie) ? rawCookie : DEFAULT_LOCALE;

  // Rewrite (NOT redirect) — URL in browser stays as-is
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname}`;

  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image, _next/data
     * - favicon.ico
     * - files with extensions (e.g. .png, .js, .css)
     */
    "/((?!_next/static|_next/image|_next/data|favicon\\.ico|.*\\..*).*)",
  ],
};
