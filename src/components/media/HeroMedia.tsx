"use client";

import { useRef, useState } from "react";
import Image, { type StaticImageData } from "next/image";

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

export function HeroMedia(props: HeroMediaProps) {
  const { alt } = props;
  const rounded = props.rounded ?? true;
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const wrapperClass = rounded
    ? "rounded-3xl overflow-hidden bg-white/5 ring-1 ring-white/10 shadow-xl"
    : "w-full";

  const handlePlayFullscreen = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      // Unmute video for fullscreen playback
      video.muted = false;

      // Try standard fullscreen API
      if (video.requestFullscreen) {
        await video.requestFullscreen();
      }
      // Try iOS Safari fullscreen API
      else if ((video as any).webkitEnterFullscreen) {
        (video as any).webkitEnterFullscreen();
      }
      // Try older webkit API
      else if ((video as any).webkitRequestFullscreen) {
        await (video as any).webkitRequestFullscreen();
      }
    } catch (error) {
      console.error("Fullscreen failed:", error);
      // Fallback: just play the video with sound
      video.play();
    }
  };

  if (props.type === "video") {
    // If video failed to load and we have a fallback, show image instead
    if (videoError && props.imageFallback) {
      return (
        <div className={wrapperClass}>
          <Image
            src={props.imageFallback}
            alt={alt}
            className="w-full h-auto"
          />
        </div>
      );
    }

    return (
      <div className={rounded ? wrapperClass : "relative w-full"}>
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          controls={false}
          preload="auto"
          onError={() => setVideoError(true)}
          className="w-full h-auto"
          aria-label={alt}
        >
          <source src={props.src.replace('.webm', '.mp4')} type="video/mp4" />
          <source src={props.src} type="video/webm" />
        </video>

        {/* Bouton play en overlay */}
        <button
          type="button"
          onClick={handlePlayFullscreen}
          className="absolute bottom-4 right-4 z-20 flex items-center justify-center w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm ring-1 ring-white/20 hover:bg-black/50 transition-colors"
          aria-label="Lire en plein écran"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6 text-white"
            style={{ marginLeft: "2px" }}
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      </div>
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
    <div className={wrapperClass}>
      <Image
        src={src}
        alt={alt}
        priority={priority}
        sizes={sizes}
        className="w-full h-auto"
        {...dimensionProps}
      />
    </div>
  );
}
