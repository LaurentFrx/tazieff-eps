import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

const BUCKET = "exercise-media";
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

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
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "formData_parse_failed";
      logError("BAD_REQUEST", 400, message);
      return errorJson(400, "BAD_REQUEST", "Payload invalide.");
    }

    const pin = formData.get("pin");
    const slug = formData.get("slug");
    const file = formData.get("file");
    const width = formData.get("width");
    const height = formData.get("height");

    if (typeof pin !== "string" || typeof slug !== "string" || !slug.trim()) {
      logError("BAD_REQUEST", 400, "missing_fields");
      return errorJson(400, "BAD_REQUEST", "Champs requis manquants.");
    }

    if (!file || typeof file === "string") {
      logError("BAD_REQUEST", 400, "missing_file");
      return errorJson(400, "BAD_REQUEST", "Fichier manquant.");
    }

    if (pin !== process.env.TEACHER_PIN) {
      logError("UNAUTHORIZED", 401, "invalid_pin");
      return errorJson(401, "UNAUTHORIZED", "PIN invalide.");
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

    let supabase: ReturnType<typeof getSupabaseServiceClient>;
    try {
      supabase = getSupabaseServiceClient();
    } catch (error) {
      const message = error instanceof Error ? error.message : "supabase_init_failed";
      logError("SERVER_MISCONFIG", 500, message);
      return errorJson(
        500,
        "SERVER_MISCONFIG",
        "Configuration serveur incomplète.",
      );
    }
    const { error: uploadError } = await supabase
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

    const { data, error } = await supabase
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
      const { data: publicData } = supabase
        .storage
        .from(data.bucket)
        .getPublicUrl(data.path);
      publicUrl = publicData.publicUrl || undefined;
    }

    return NextResponse.json({
      mediaId: data.id,
      bucket: data.bucket,
      path: data.path,
      publicUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unhandled_error";
    logError("UNHANDLED", 500, message);
    return errorJson(500, "UNHANDLED", "Une erreur est survenue.");
  }
}
