import { seancesIndex } from "@/lib/content/fs";
import { SeanceListClient } from "@/app/[locale]/seances/SeanceListClient";
import { getServerLang } from "@/lib/i18n/server";

export default async function SeancesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  const locale = getServerLang(localeParam);
  const seances = await seancesIndex(locale);

  return (
    <section className="page">
      <SeanceListClient seances={seances} />
    </section>
  );
}
