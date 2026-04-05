import type { Metadata } from 'next';
import { PosterSelector } from '@/components/qr/GymPoster';

export const metadata: Metadata = {
  title: 'Posters Salle — Tazieff EPS',
  description: 'Posters A4 imprimables avec QR codes pour affichage en salle de musculation.',
};

export default function PostersPage() {
  return (
    <section className="page print:p-0 print:m-0">
      <div className="mb-4 print:hidden">
        <h1 className="text-2xl font-bold text-[color:var(--ink)]">Posters Salle</h1>
        <p className="text-sm text-[color:var(--muted)] mt-1">
          3 affiches A4 par objectif d'entraînement avec QR code.
        </p>
      </div>
      <PosterSelector />
    </section>
  );
}
