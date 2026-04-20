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

export const mediaUrlCache = new Map<string, string>();

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
