"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import Image, { type StaticImageData } from "next/image";
import { useI18n } from "@/lib/i18n/I18nProvider";

type HeroMediaProps =
  | {
      type?: "image";
      src: StaticImageData;
      alt: string;
      priority?: boolean;
      sizes?: string;
      rounded?: boolean;
    }
  | {
      type?: "image";
      src: string;
      alt: string;
      priority?: boolean;
      sizes?: string;
      width: number;
      height: number;
      rounded?: boolean;
    }
  | {
      type: "video";
      src: string;
      alt: string;
      imageFallback?: string | StaticImageData;
      rounded?: boolean;
    };

function ImageLightbox({
  src,
  alt,
  width,
  height,
  onClose,
}: {
  src: string | StaticImageData;
  alt: string;
  width?: number;
  height?: number;
  onClose: () => void;
}) {
  const { t } = useI18n();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.95)" }}
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        style={{
          top: "max(16px, env(safe-area-inset-top, 16px))",
          right: "max(16px, env(safe-area-inset-right, 16px))",
        }}
        aria-label={t("media.closeLightbox")}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={typeof src === "string" ? src : (src as StaticImageData).src}
        alt={alt}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          touchAction: "pinch-zoom",
        }}
        onClick={(e) => e.stopPropagation()}
      />
    </div>,
    document.body,
  );
}

/* ── Video fullscreen overlay (iOS PWA compatible) ── */
function VideoFullscreen({
  videoSrc,
  onClose,
}: {
  videoSrc: string;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { t } = useI18n();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    // Try to lock to landscape (not available in all browsers)
    try { (screen.orientation as any)?.lock?.("landscape")?.catch?.(() => {}); } catch {}
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      try { (screen.orientation as any)?.unlock?.(); } catch {}
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        aria-label={t("media.closeLightbox")}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
      </button>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        loop
        controls={false}
        className="w-full h-full object-contain"
        onClick={(e) => e.stopPropagation()}
      >
        <source src={`${videoSrc}.webm`} type="video/webm" />
        <source src={`${videoSrc}.mp4`} type="video/mp4" />
      </video>
    </div>,
    document.body,
  );
}

export function HeroMedia(props: HeroMediaProps) {
  const { alt } = props;
  const { t } = useI18n();
  const rounded = props.rounded ?? true;
  const [videoError, setVideoError] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wasPlayingRef = useRef(false);

  // Check prefers-reduced-motion
  const prefersReducedMotion = useRef(false);
  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion.current && videoRef.current) {
      videoRef.current.pause();
    }
  }, []);

  // Native listener on last <source> — more reliable than React onError for <source>
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const sources = video.querySelectorAll("source");
    const last = sources[sources.length - 1];
    if (!last) return;
    const onFail = () => setVideoError(true);
    last.addEventListener("error", onFail);
    return () => last.removeEventListener("error", onFail);
  }, []);

  // Pause/resume on scroll visibility
  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;
    function onScroll() {
      const rect = container!.getBoundingClientRect();
      const visible = rect.bottom > 0 && rect.top < window.innerHeight;
      if (!visible && !video!.paused) {
        wasPlayingRef.current = true;
        video!.pause();
      } else if (visible && wasPlayingRef.current) {
        wasPlayingRef.current = false;
        video!.play().catch(() => {});
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  const wrapperClass = rounded
    ? "rounded-3xl overflow-hidden bg-white/5 ring-1 ring-white/10 shadow-xl"
    : "w-full";

  if (props.type === "video") {
    // If video failed to load and we have a fallback, show tappable image
    if (videoError && props.imageFallback) {
      return (
        <>
          <div
            className={wrapperClass}
            onClick={() => setShowLightbox(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setShowLightbox(true);
            }}
            style={{ cursor: "pointer" }}
          >
            <Image
              src={props.imageFallback}
              alt={alt}
              width={800}
              height={600}
              sizes="(max-width: 768px) 100vw, 50vw"
              className="w-full h-auto"
            />
          </div>
          {showLightbox && (
            <ImageLightbox
              src={props.imageFallback}
              alt={alt}
              width={800}
              height={600}
              onClose={() => setShowLightbox(false)}
            />
          )}
        </>
      );
    }

    return (
      <>
        <div ref={containerRef} className={rounded ? wrapperClass : "relative w-full"}>
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            controls={false}
            preload="auto"
            className="w-full h-auto"
            aria-label={alt}
            onClick={() => setShowFullscreen(true)}
            style={{ cursor: "pointer" }}
            onError={() => setVideoError(true)}
          >
            <source src={`${props.src}.webm`} type="video/webm" />
            <source src={`${props.src}.mp4`} type="video/mp4" />
          </video>

          {/* Mute toggle button */}
          <button
            type="button"
            onClick={toggleMute}
            className="absolute bottom-4 right-4 z-20 flex items-center justify-center w-11 h-11 rounded-full bg-black/30 backdrop-blur-sm ring-1 ring-white/20 text-white hover:bg-black/40 transition-colors"
            aria-label={isMuted ? t("media.unmute") : t("media.mute")}
          >
            {isMuted ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            )}
          </button>
        </div>

        {showFullscreen && (
          <VideoFullscreen
            videoSrc={props.src}
            onClose={() => setShowFullscreen(false)}
          />
        )}
      </>
    );
  }

  const {
    src,
    priority,
    sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 900px, 1100px",
  } = props;

  const dimensionProps =
    typeof src === "string"
      ? {
          width: (
            props as Extract<
              HeroMediaProps,
              { type?: "image"; src: string; width: number }
            >
          ).width,
          height: (
            props as Extract<
              HeroMediaProps,
              { type?: "image"; src: string; height: number }
            >
          ).height,
        }
      : undefined;

  return (
    <>
      <div
        className={wrapperClass}
        onClick={() => setShowLightbox(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setShowLightbox(true);
        }}
        style={{ cursor: "pointer" }}
      >
        <Image
          src={src}
          alt={alt}
          priority={priority}
          sizes={sizes}
          className="w-full h-auto"
          {...dimensionProps}
        />
      </div>

      {showLightbox && (
        <ImageLightbox
          src={src}
          alt={alt}
          onClose={() => setShowLightbox(false)}
          {...dimensionProps}
        />
      )}
    </>
  );
}
