import { seancesIndex } from "@/lib/content/fs";
import { SeanceListClient } from "@/app/seances/SeanceListClient";

export default async function SeancesPage() {
  const seances = await seancesIndex();

  return (
    <section className="page">
      <SeanceListClient seances={seances} />
    </section>
  );
}
