import { seancesIndex } from "@/lib/content/fs";
import { SeanceListClient } from "@/app/seances/SeanceListClient";
import { getServerLang } from "@/lib/i18n/server";

export default async function SeancesPage() {
  const locale = await getServerLang();
  const seances = await seancesIndex(locale);

  return (
    <section className="page">
      <SeanceListClient seances={seances} />
    </section>
  );
}
