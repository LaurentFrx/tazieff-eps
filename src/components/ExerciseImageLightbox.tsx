"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";

type Props = {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  rounded?: boolean;
  children?: React.ReactNode;
};

export function ExerciseImageLightbox({ src, alt, width, height, priority, rounded = true, children }: Props) {
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState(1);

  const close = useCallback(() => {
    setOpen(false);
    setScale(1);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  return (
    <>
      {/* Tap target — wraps the existing HeroMedia or image */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative block w-full cursor-zoom-in"
        aria-label={`Zoomer sur ${alt}`}
      >
        {children ?? (
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            priority={priority}
            className={`w-full h-auto ${rounded ? "rounded-2xl" : ""}`}
          />
        )}
        {/* Zoom indicator */}
        <span className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white/70 text-[11px] pointer-events-none">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /><path d="M11 8v6" /><path d="M8 11h6" />
          </svg>
        </span>
      </button>

      {/* Lightbox overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          style={{ background: "rgba(4,4,10,0.95)" }}
          onClick={(e) => { if (e.target === e.currentTarget) close(); }}
          role="dialog"
          aria-label="Zoom image"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={close}
            className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm ring-1 ring-white/20 text-white transition-opacity hover:opacity-80"
            style={{ top: "max(16px, env(safe-area-inset-top, 16px))" }}
            aria-label="Fermer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18" /><path d="M6 6l12 12" />
            </svg>
          </button>

          {/* Zoomable image */}
          <div
            className="flex-1 overflow-auto flex items-center justify-center w-full"
            style={{ touchAction: "pan-x pan-y pinch-zoom" }}
          >
            <Image
              src={src}
              alt={alt}
              width={width}
              height={height}
              className="max-w-none transition-transform duration-200"
              style={{ transform: `scale(${scale})`, transformOrigin: "center center" }}
              sizes="100vw"
              priority
            />
          </div>

          {/* Zoom controls */}
          <div
            className="flex items-center gap-3 pb-4"
            style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom, 16px))" }}
          >
            <button
              type="button"
              onClick={() => setScale((s) => Math.max(1, s - 0.5))}
              disabled={scale <= 1}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm ring-1 ring-white/20 text-white transition-opacity hover:opacity-80 disabled:opacity-30"
              aria-label="Dézoomer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14" /></svg>
            </button>
            <span className="text-[12px] font-mono text-white/60 min-w-[28px] text-center">
              {scale}x
            </span>
            <button
              type="button"
              onClick={() => setScale((s) => Math.min(4, s + 0.5))}
              disabled={scale >= 4}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm ring-1 ring-white/20 text-white transition-opacity hover:opacity-80 disabled:opacity-30"
              aria-label="Zoomer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
