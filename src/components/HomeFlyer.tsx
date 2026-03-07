import Image from "next/image";
import flyer from "../../public/media/branding/flyer-eps.webp";

interface HomeFlyerProps {
  greeting?: string;
}

export function HomeFlyer({ greeting }: HomeFlyerProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur">
      <Image
        src={flyer}
        alt="Flyer Muscu'Tazieff"
        priority
        className="h-auto w-full object-contain"
        sizes="(max-width: 768px) 100vw, 1280px"
      />
      {greeting && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm py-2 overflow-hidden">
          <span
            className="inline-block whitespace-nowrap text-base md:text-lg font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] animate-scroll-text"
          >
            {greeting}
          </span>
        </div>
      )}
    </div>
  );
}
