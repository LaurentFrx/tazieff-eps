import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BASIC_AUTH_ENV = process.env.ADMIN_BASIC_AUTH;

function unauthorized() {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Admin"',
    },
  });
}

export function proxy(request: NextRequest) {
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

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
