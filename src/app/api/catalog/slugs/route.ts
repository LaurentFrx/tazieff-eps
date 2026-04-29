/**
 * Sprint E.3 (28 avril 2026) — endpoint utilitaire pour le panneau « Liens »
 * de TeacherOverrideEditor. Retourne la liste des slugs disponibles dans le
 * catalogue MDX local pour les deux familles éditables :
 *
 *   GET /api/catalog/slugs
 *   → { exercices: Array<{slug, title}>, methodes: Array<{slug, title}> }
 *
 * Pas d'auth : le contenu retourné est l'ensemble des slugs publiquement
 * lisibles via /exercices et /methodes. La payload ne contient aucune donnée
 * sensible. Cache court côté HTTP pour éviter de relire le filesystem à
 * chaque ouverture du modal admin.
 */

import { NextResponse } from "next/server";

import { getAllExercises, getAllMethodes } from "@/lib/content/fs";

export const runtime = "nodejs";
// Lecture FS — éviter le static rendering, mais accepte le cache HTTP court.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [exercises, methodes] = await Promise.all([
      getAllExercises("fr"),
      getAllMethodes("fr"),
    ]);

    const payload = {
      exercices: exercises
        .map((exercise) => ({ slug: exercise.slug, title: exercise.title }))
        .sort((a, b) => a.title.localeCompare(b.title, "fr")),
      methodes: methodes
        .map((methode) => ({ slug: methode.slug, title: methode.titre }))
        .sort((a, b) => a.title.localeCompare(b.title, "fr")),
    };

    return NextResponse.json(payload, {
      headers: {
        // Cache 5 min côté CDN pour éviter le full FS scan à chaque ouverture
        // du modal d'édition, tout en restant frais après ajout d'une fiche.
        "Cache-Control": "public, max-age=0, s-maxage=300",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "catalog_slugs_failed",
        detail: error instanceof Error ? error.message : "unknown",
      },
      { status: 500 },
    );
  }
}
