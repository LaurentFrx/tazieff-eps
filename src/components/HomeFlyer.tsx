import Image from "next/image";
import Link from "next/link";
import flyer from "../../public/media/branding/flyer-eps.webp";

export function HomeFlyer() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur">
      <Link
        href="/reglages"
        aria-label="Paramètres"
        className="icon-button absolute right-4 top-4"
      >
        <span aria-hidden="true">⚙️</span>
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
