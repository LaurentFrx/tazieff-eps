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

  const wrapperClass = rounded
    ? "rounded-3xl overflow-hidden bg-white/5 ring-1 ring-white/10 shadow-xl"
    : "w-full";

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
      <div className={wrapperClass}>
        <video
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
