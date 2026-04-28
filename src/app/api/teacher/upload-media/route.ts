// Phase P0.1 + P0.5 — POST /api/teacher/upload-media
//
// Verrouillage admin : route gatée par requireAdmin().
//
// P0.5 — Le bucket `exercise-media` a maintenant une matrice RLS conforme
// sur `storage.objects` (SELECT public, INSERT/UPDATE/DELETE admin). L'upload
// Storage bascule donc vers le client utilisateur authentifié (qui doit
// passer requireAdmin), avec en bonus le remplissage automatique de la
// colonne `owner` (= auth.uid() = admin.user.id) par Supabase Storage.
//
// La lecture côté client (`storage.from(bucket).getPublicUrl(path)`) marche
// désormais sans signedUrl, grâce à la policy SELECT publique. On retourne
// quand même une signedUrl en réponse pour préserver la rétrocompat
// `mediaUrlCache` côté client (TTL 30min).
//
// Note : la table `media_assets` n'a pas (encore) de policy INSERT admin.
// L'insert dans cette table reste donc sous service client en attendant
// une migration future qui posera la même matrice que `storage.objects`.
//
// Référence : GOUVERNANCE_EDITORIALE.md §3.1, §7.

import { NextResponse } from "next/server";
import { createSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";
import { requireAdmin, AuthError } from "@/lib/auth/requireAdmin";

export const runtime = "nodejs";

const BUCKET = "exercise-media";
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const SIGNED_URL_TTL_SECONDS = 1800;

function errorJson(status: number, code: string, message: string) {
  return NextResponse.json({ ok: false, code, message }, { status });
}

function logError(code: string, status: number, message: string, details?: string) {
  const safeDetails = details ? details.replace(/\s+/g, " ").trim() : "";
  const suffix = safeDetails ? ` ${safeDetails}` : "";
  console.error(`[upload] code=${code} status=${status} msg=${message}${suffix}`);
}

function getSupabaseMeta(error: unknown) {
  if (!error || typeof error !== "object") {
    return { status: undefined, details: "", hint: "" };
  }
  const status =
    "status" in error && typeof (error as { status?: number }).status === "number"
      ? (error as { status?: number }).status
      : undefined;
  const details =
    "details" in error ? String((error as { details?: string }).details ?? "") : "";
  const hint =
    "hint" in error ? String((error as { hint?: string }).hint ?? "") : "";
  return { status, details, hint };
}

export async function POST(request: Request) {
  try {
    // P0.1 : garde admin authentifié AVANT de toucher au formData (économie
    // de bande passante si l'utilisateur n'est pas admin).
    const userSupabase = await createSupabaseServerClient();
    try {
      await requireAdmin(userSupabase);
    } catch (err) {
      if (err instanceof AuthError) {
        logError(
          err.code === "unauthenticated" ? "UNAUTHORIZED" : "FORBIDDEN",
          err.status,
          err.code,
        );
        return errorJson(
          err.status,
          err.code === "unauthenticated" ? "UNAUTHORIZED" : "FORBIDDEN",
          err.code === "unauthenticated"
            ? "Authentification requise."
            : "Accès refusé.",
        );
      }
      logError("UNHANDLED", 500, "auth_check_failed");
      return errorJson(500, "UNHANDLED", "Erreur interne.");
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "formData_parse_failed";
      logError("BAD_REQUEST", 400, message);
      return errorJson(400, "BAD_REQUEST", "Payload invalide.");
    }

    const slug = formData.get("slug");
    const file = formData.get("file");
    const width = formData.get("width");
    const height = formData.get("height");

    if (typeof slug !== "string" || !slug.trim()) {
      logError("BAD_REQUEST", 400, "missing_fields");
      return errorJson(400, "BAD_REQUEST", "Champs requis manquants.");
    }

    if (!file || typeof file === "string") {
      logError("BAD_REQUEST", 400, "missing_file");
      return errorJson(400, "BAD_REQUEST", "Fichier manquant.");
    }

    if (!file.type || !ALLOWED_MIME_TYPES.has(file.type)) {
      logError(
        "UNSUPPORTED_TYPE",
        415,
        "unsupported_type",
        `type=${file.type || "unknown"}`,
      );
      return errorJson(415, "UNSUPPORTED_TYPE", "Format invalide.");
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      logError("FILE_TOO_LARGE", 413, "file_too_large", `size=${file.size}`);
      return errorJson(413, "FILE_TOO_LARGE", "Fichier trop volumineux.");
    }

    const safeSlug = slug.trim();
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `media-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const path = `exercises/${safeSlug}/${id}.webp`;

    const supabaseUrl =
      process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !supabaseUrl) {
      logError("SERVER_MISCONFIG", 500, "missing_supabase_env");
      return errorJson(
        500,
        "SERVER_MISCONFIG",
        "Configuration serveur incomplète.",
      );
    }

    let arrayBuffer: ArrayBuffer;
    try {
      arrayBuffer = await (file as File).arrayBuffer();
    } catch (error) {
      const message = error instanceof Error ? error.message : "file_unreadable";
      logError("BAD_REQUEST", 400, message);
      return errorJson(400, "BAD_REQUEST", "Fichier illisible.");
    }

    // P0.5 : l'upload Storage passe désormais par le client utilisateur
    // (admin authentifié), grâce à la policy `storage_exercise_media_insert_admin`.
    // Supabase Storage remplit automatiquement la colonne `owner` avec auth.uid().
    const { error: uploadError } = await userSupabase
      .storage
      .from(BUCKET)
      .upload(path, arrayBuffer, {
        contentType: file.type || "image/webp",
        upsert: false,
      });

    if (uploadError) {
      const meta = getSupabaseMeta(uploadError);
      const detailParts = [
        `bucket=${BUCKET}`,
        `path=${path}`,
        meta.status !== undefined ? `status=${meta.status}` : "",
        meta.details ? `details=${meta.details}` : "",
        meta.hint ? `hint=${meta.hint}` : "",
      ].filter(Boolean);
      logError(
        "SUPABASE_ERROR",
        meta.status ?? 500,
        uploadError.message,
        detailParts.join(" "),
      );
      return errorJson(500, "SUPABASE_ERROR", "Erreur d'upload.");
    }

    const parsedWidth = typeof width === "string" ? Number.parseInt(width, 10) : NaN;
    const parsedHeight = typeof height === "string" ? Number.parseInt(height, 10) : NaN;

    // P0.5 : `media_assets` n'a pas (encore) de policy admin INSERT, on
    // garde le service client pour cette table tant que la migration
    // dédiée n'est pas posée. Le risque résiduel est circonscrit (la route
    // est déjà gardée par requireAdmin).
    let serviceSupabase: ReturnType<typeof getSupabaseServiceClient>;
    try {
      serviceSupabase = getSupabaseServiceClient();
    } catch (error) {
      const message = error instanceof Error ? error.message : "supabase_init_failed";
      logError("SERVER_MISCONFIG", 500, message);
      return errorJson(500, "SERVER_MISCONFIG", "Configuration serveur incomplète.");
    }

    const { data, error } = await serviceSupabase
      .from("media_assets")
      .insert({
        bucket: BUCKET,
        path,
        mime: file.type || "image/webp",
        size: Number.isFinite(file.size) ? file.size : null,
        width: Number.isFinite(parsedWidth) ? parsedWidth : null,
        height: Number.isFinite(parsedHeight) ? parsedHeight : null,
      })
      .select("id, bucket, path, canonical_url")
      .single();

    if (error || !data) {
      const meta = getSupabaseMeta(error);
      const detailParts = [
        `bucket=${BUCKET}`,
        `path=${path}`,
        meta.status !== undefined ? `status=${meta.status}` : "",
        meta.details ? `details=${meta.details}` : "",
        meta.hint ? `hint=${meta.hint}` : "",
      ].filter(Boolean);
      logError(
        "SUPABASE_ERROR",
        meta.status ?? 500,
        error?.message ?? "insert_failed",
        detailParts.join(" "),
      );
      return errorJson(500, "SUPABASE_ERROR", "Erreur d'enregistrement.");
    }

    let publicUrl: string | undefined;
    if (data.canonical_url) {
      publicUrl = data.canonical_url;
    } else if (data.bucket && data.path) {
      const { data: publicData } = userSupabase
        .storage
        .from(data.bucket)
        .getPublicUrl(data.path);
      publicUrl = publicData.publicUrl || undefined;
    }

    let bucketIsPublic: boolean | undefined;
    if (data.bucket && "getBucket" in userSupabase.storage) {
      const storageApi = userSupabase.storage as typeof userSupabase.storage & {
        getBucket?: (bucket: string) => Promise<{
          data?: { public?: boolean } | null;
          error?: unknown;
        }>;
      };
      if (storageApi.getBucket) {
        const { data: bucketData, error: bucketError } = await storageApi.getBucket(
          data.bucket,
        );
        if (!bucketError && bucketData) {
          bucketIsPublic = !!bucketData.public;
        }
      }
    }

    let url = "";
    if (bucketIsPublic && publicUrl) {
      url = publicUrl;
    } else if (data.bucket && data.path) {
      // P0.5 : la policy SELECT publique sur exercise-media rend la
      // signedUrl optionnelle, mais on en génère une pour rétrocompat
      // avec mediaUrlCache côté client.
      const { data: signedData } = await userSupabase
        .storage
        .from(data.bucket)
        .createSignedUrl(data.path, SIGNED_URL_TTL_SECONDS);
      url = signedData?.signedUrl ?? publicUrl ?? "";
    } else if (publicUrl) {
      url = publicUrl;
    }

    return NextResponse.json({
      ok: true,
      mediaId: data.id,
      bucket: data.bucket,
      path: data.path,
      url,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unhandled_error";
    logError("UNHANDLED", 500, message);
    return errorJson(500, "UNHANDLED", "Une erreur est survenue.");
  }
}
