import type { Metadata } from 'next';
import { getExercisesIndex } from '@/lib/exercices/getExercisesIndex';
import { getServerLang } from '@/lib/i18n/server';
import { QrCodeGenerator } from '@/components/qr/QrCodeGenerator';

export const metadata: Metadata = {
  title: 'QR Codes Machines — Tazieff EPS',
  description: 'Générer et imprimer des QR codes pour les machines de la salle de musculation.',
};

export default async function QrCodesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const lang = getServerLang(locale);
  const exercises = await getExercisesIndex(lang);

  const data = exercises.map((ex) => ({
    slug: ex.slug,
    title: ex.title,
    muscles: ex.muscles ?? [],
    equipment: ex.equipment ?? [],
  }));

  return (
    <section className="page">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-[color:var(--ink)]">QR Codes Machines</h1>
        <p className="text-sm text-[color:var(--muted)] mt-1 print:hidden">
          Imprimez des QR codes pour chaque machine de votre salle.
        </p>
      </div>
      <QrCodeGenerator exercises={data} />
    </section>
  );
}
