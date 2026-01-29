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

    let arrayBuffer: ArrayBuffer;
    try {
      arrayBuffer = await (file as File).arrayBuffer();
    } catch (error) {
      const message = error instanceof Error ? error.message : "file_unreadable";
      logError("BAD_REQUEST", 400, message);
      return errorJson(400, "BAD_REQUEST", "Fichier illisible.");
    }

    const supabase = getSupabaseServiceClient();
    const { error: uploadError } = await supabase
      .storage
      .from(BUCKET)
      .upload(path, arrayBuffer, {
        contentType: file.type || "image/webp",
        upsert: false,
      });

    if (uploadError) {
      const uploadDetails =
        typeof uploadError === "object" && uploadError && "details" in uploadError
          ? String((uploadError as { details?: string }).details ?? "")
          : "";
      logError(
        "SUPABASE_ERROR",
        500,
        uploadError.message,
        `details=${uploadDetails}`,
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
      logError(
        "SUPABASE_ERROR",
        500,
        error?.message ?? "insert_failed",
        `details=${error?.details ?? ""}`,
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
