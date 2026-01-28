import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

const BUCKET = "exercise-media";

export async function POST(request: Request) {
  let formData: FormData | null = null;
  try {
    formData = await request.formData();
  } catch {
    formData = null;
  }

  if (!formData) {
    return NextResponse.json({ error: "Payload invalide." }, { status: 400 });
  }

  const pin = formData.get("pin");
  const slug = formData.get("slug");
  const file = formData.get("file");
  const width = formData.get("width");
  const height = formData.get("height");

  if (typeof pin !== "string" || typeof slug !== "string" || !slug.trim()) {
    return NextResponse.json({ error: "Champs requis manquants." }, { status: 400 });
  }

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "Fichier manquant." }, { status: 400 });
  }

  if (pin !== process.env.TEACHER_PIN) {
    return NextResponse.json({ error: "PIN invalide." }, { status: 401 });
  }

  if (file.type && file.type !== "image/webp") {
    return NextResponse.json({ error: "Format invalide." }, { status: 400 });
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
  } catch {
    return NextResponse.json({ error: "Fichier illisible." }, { status: 400 });
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
    return NextResponse.json({ error: "Erreur d'upload." }, { status: 500 });
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
    return NextResponse.json({ error: "Erreur d'enregistrement." }, { status: 500 });
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
}
