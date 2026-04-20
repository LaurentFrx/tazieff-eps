// Phase B.1.2 — shared media utilities for the teacher override editor.
// Extracted from ExerciseLiveDetail.tsx so both the parent (JSX modal
// still uses mediaUrlCache) and useOverrideMediaUpload hook can share them.

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
export const IMAGE_MAX_EDGE = 1600;
export const IMAGE_QUALITY = 0.82;
// Phase B.2 additions: moved from parent to allow <TeacherOverrideEditor/> import.
export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";
export const HERO_OVERRIDE_DIMENSIONS = { width: 1600, height: 900 };

export const mediaUrlCache = new Map<string, string>();

type MediaInfoLite = {
  mime?: string | null;
  size?: number | null;
  width?: number | null;
  height?: number | null;
};

export function appendCacheBust(url: string, token: number) {
  if (!token) {
    return url;
  }
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}retry=${token}`;
}

export function formatBytes(bytes?: number | null) {
  if (typeof bytes !== "number" || !Number.isFinite(bytes) || bytes <= 0) {
    return null;
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${Math.round(kb)} Ko`;
  }
  const mb = kb / 1024;
  const formatted = mb.toFixed(mb >= 10 ? 0 : 1).replace(".", ",");
  return `${formatted} Mo`;
}

export function formatMediaInfo(info?: MediaInfoLite | null) {
  if (!info) {
    return null;
  }
  const parts: string[] = [];
  if (info.mime) {
    const format = info.mime.split("/").pop()?.trim();
    if (format) {
      parts.push(format.toUpperCase());
    }
  }
  const width = typeof info.width === "number" ? info.width : null;
  const height = typeof info.height === "number" ? info.height : null;
  if (width && height) {
    parts.push(`${width}×${height}`);
  }
  const size = formatBytes(info.size ?? null);
  if (size) {
    parts.push(size);
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

export type ImageSourceInfo = {
  source: CanvasImageSource;
  width: number;
  height: number;
  revoke?: () => void;
};

export async function loadImageSource(file: File): Promise<ImageSourceInfo> {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file);
    return {
      source: bitmap as CanvasImageSource,
      width: bitmap.width,
      height: bitmap.height,
      revoke: () => {
        if ("close" in bitmap) {
          bitmap.close();
        }
      },
    };
  }

  const url = URL.createObjectURL(file);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Impossible de charger l'image."));
    image.src = url;
  });

  return {
    source: img as CanvasImageSource,
    width: img.naturalWidth || img.width,
    height: img.naturalHeight || img.height,
    revoke: () => URL.revokeObjectURL(url),
  };
}

export async function compressImageToWebp(sourceInfo: ImageSourceInfo) {
  const { source, width, height, revoke } = sourceInfo;
  const maxEdge = Math.max(width, height);
  const scale = maxEdge > IMAGE_MAX_EDGE ? IMAGE_MAX_EDGE / maxEdge : 1;
  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const context = canvas.getContext("2d");
  if (!context) {
    revoke?.();
    throw new Error("Canvas indisponible.");
  }
  context.drawImage(source, 0, 0, targetWidth, targetHeight);
  revoke?.();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) {
          resolve(result);
        } else {
          reject(new Error("Compression échouée."));
        }
      },
      "image/webp",
      IMAGE_QUALITY,
    );
  });

  return { blob, width: targetWidth, height: targetHeight };
}

export function formatResolveError(
  status: number | null | undefined,
  t: (key: string) => string,
) {
  if (typeof status === "number" && Number.isFinite(status)) {
    return t("exerciseEditor.fetchFailedWithStatus").replace(
      "{status}",
      String(status),
    );
  }
  return t("exerciseEditor.urlError");
}
