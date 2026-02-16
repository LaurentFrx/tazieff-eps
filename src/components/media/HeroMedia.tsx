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
    };

export function HeroMedia(props: HeroMediaProps) {
  const { alt } = props;

  if (props.type === "video") {
    return (
      <div className="rounded-3xl overflow-hidden bg-white/5 ring-1 ring-white/10 shadow-xl">
        <video
          src={props.src}
          autoPlay
          muted
          loop
          playsInline
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
