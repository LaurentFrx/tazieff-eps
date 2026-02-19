import Image from "next/image";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import flyer from "../../public/media/branding/flyer-eps.webp";

export function HomeFlyer() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur">
      <Link
        href="/reglages"
        aria-label="Paramètres"
        className="icon-button absolute right-4 top-3 h-7 w-7 text-base leading-none"
      >
        <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
      </Link>
      <Image
        src={flyer}
        alt="Flyer Muscu'Tazieff"
        priority
        className="h-auto w-full object-contain"
        sizes="100vw"
      />
    </div>
  );
}
