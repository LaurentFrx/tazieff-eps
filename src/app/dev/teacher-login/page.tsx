// Phase E.2.2 — Page de test dev du flow magic link + API annotations.
// GATE stricte : uniquement accessible en NODE_ENV=development ou VERCEL_ENV=preview.
// En production (muscu-eps.fr), notFound() → 404.
//
// À retirer une fois l'UI E.2.3 en place (ou à garder gated pour debug long terme).

import { notFound } from "next/navigation";
import TeacherLoginDevClient from "./TeacherLoginDevClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function TeacherLoginDevPage() {
  const isDev = process.env.NODE_ENV === "development";
  const isPreview = process.env.VERCEL_ENV === "preview";
  if (!isDev && !isPreview) {
    notFound();
  }
  return <TeacherLoginDevClient />;
}
