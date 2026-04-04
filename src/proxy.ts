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

/* ── i18n locale rewrite ─────────────────────────────────────────────── */

const LOCALES = ["fr", "en", "es"];

/* ── Main proxy ──────────────────────────────────────────────────────── */

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin basic auth
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const authResponse = handleAdminAuth(request);
    if (authResponse) return authResponse;
    return NextResponse.next();
  }

  // Skip if already prefixed by a locale
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
