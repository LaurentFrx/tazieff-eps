import { seancesIndex } from "@/lib/content/fs";
import { SeanceListClient } from "@/app/seances/SeanceListClient";

export default async function SeancesPage() {
  const seances = await seancesIndex();

  return (
    <section className="page">
      <header className="page-header">
        <p className="eyebrow">Séances</p>
        <h1>Plans de séance</h1>
        <p className="lede">
          Des formats prêts à l&apos;emploi pour structurer vos entraînements.
        </p>
      </header>
      <SeanceListClient seances={seances} />
    </section>
  );
}
