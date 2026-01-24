import Image from "next/image";

type HeroMediaProps = {
  src: string;
  alt: string;
  heightClass?: string;
};

const DEFAULT_HEIGHT_CLASS = "h-[70svh] max-h-[820px] min-h-[320px]";

export function HeroMedia({
  src,
  alt,
  heightClass = DEFAULT_HEIGHT_CLASS,
}: HeroMediaProps) {
  return (
    <div
      className={`relative w-full ${heightClass} rounded-3xl overflow-hidden bg-white/5 ring-1 ring-white/10 shadow-xl`.trim()}
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
