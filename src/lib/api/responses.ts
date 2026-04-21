// Phase E.2.2 — Helpers de réponses API uniformes.
// Convention : toutes les erreurs de nos routes Next.js App Router passent
// par jsonError(). Cela simplifie le rendu côté client et les tests.

import { NextResponse } from "next/server";

export type ErrorCode =
  | "validation"
  | "unauthenticated"
  | "forbidden"
  | "not_found"
  | "internal"
  | "not_academic"
  | "conflict";

export function jsonError(
  status: number,
  code: ErrorCode,
  details?: unknown,
): NextResponse {
  return NextResponse.json(
    { error: code, ...(details !== undefined ? { details } : {}) },
    { status },
  );
}

/**
 * Réponse de succès uniforme. Optionnel — les routes peuvent aussi
 * utiliser `NextResponse.json(data, {status})` directement.
 */
export function jsonOk<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}
