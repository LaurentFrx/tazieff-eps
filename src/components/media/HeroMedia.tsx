"use client";

import { useState } from "react";
import Image, { type StaticImageData } from "next/image";

type HeroMediaProps =
  | {
      type?: "image";
      src: StaticImageData;
      alt: string;
      priority?: boolean;
      sizes?: string;
    }
  | {
      type?: "image";
      src: string;
      alt: string;
      priority?: boolean;
      sizes?: string;
      width: number;
      height: number;
    }
  | {
      type: "video";
      src: string;
      alt: string;
      imageFallback?: string | StaticImageData;
    };

export function HeroMedia(props: HeroMediaProps) {
  const { alt } = props;
  const [videoError, setVideoError] = useState(false);

  if (props.type === "video") {
    // If video failed to load and we have a fallback, show image instead
    if (videoError && props.imageFallback) {
      return (
        <div className="rounded-3xl overflow-hidden bg-white/5 ring-1 ring-white/10 shadow-xl">
          <Image
            src={props.imageFallback}
            alt={alt}
            className="w-full h-auto"
          />
        </div>
      );
    }

    return (
      <div className="rounded-3xl overflow-hidden bg-white/5 ring-1 ring-white/10 shadow-xl">
        <video
          src={props.src}
          autoPlay
          muted
          loop
          playsInline
          controls={false}
          preload="auto"
          onError={(e) => {
            console.error("[HeroMedia] Video load error:", props.src, e);
            setVideoError(true);
          }}
          onLoadedData={() => {
            console.log("[HeroMedia] Video loaded successfully:", props.src);
          }}
          className="w-full h-auto"
          aria-label={alt}
        />
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
    <div className="rounded-3xl overflow-hidden bg-white/5 ring-1 ring-white/10 shadow-xl">
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
