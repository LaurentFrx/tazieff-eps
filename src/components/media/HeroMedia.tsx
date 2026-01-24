import Image, { type StaticImageData } from "next/image";

type HeroMediaProps =
  | {
      src: StaticImageData;
      alt: string;
      priority?: boolean;
      sizes?: string;
    }
  | {
      src: string;
      alt: string;
      priority?: boolean;
      sizes?: string;
      width: number;
      height: number;
    };

export function HeroMedia(props: HeroMediaProps) {
  const {
    src,
    alt,
    priority,
    sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 900px, 1100px",
  } = props;

  const dimensionProps =
    typeof src === "string"
      ? {
          width: (props as Extract<HeroMediaProps, { src: string }>).width,
          height: (props as Extract<HeroMediaProps, { src: string }>).height,
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
