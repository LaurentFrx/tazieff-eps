// Phase E.2.2.5 — Banc d'essai dev migré depuis /dev/teacher-login.
// URL publique : https://design-prof.muscu-eps.fr/dev/login (preview)
//                https://localhost:3000/dev/login (dev local, via host prof.localhost)
// Sur prof.muscu-eps.fr (prod) → 404 (gate).

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
