import Image from "next/image";

type HeroMediaProps = {
  src: string;
  alt: string;
  aspectClass?: string;
};

const DEFAULT_ASPECT_CLASS = "aspect-[16/9]";

export function HeroMedia({
  src,
  alt,
  aspectClass = DEFAULT_ASPECT_CLASS,
}: HeroMediaProps) {
  return (
    <div
      className={`relative w-full overflow-hidden rounded-3xl bg-white/5 ring-1 ring-white/10 shadow-xl ${aspectClass}`.trim()}
    >
      <Image
        src={src}
        alt=""
        fill
        sizes="100vw"
        priority
        className="object-cover object-center blur-2xl opacity-40 scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-black/0" />
      <Image
        src={src}
        alt={alt}
        fill
        sizes="100vw"
        priority
        className="object-contain object-center"
      />
    </div>
  );
}
