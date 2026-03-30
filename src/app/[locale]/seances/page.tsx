import { seancesIndex } from "@/lib/content/fs";
import { SeanceListClient } from "@/app/[locale]/seances/SeanceListClient";
import { getServerLang } from "@/lib/i18n/server";

type Props = { params: Promise<{ locale: string }> };

export default async function SeancesPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  const locale = getServerLang(rawLocale);
  const seances = await seancesIndex(locale);

  return (
    <section className="page">
      <SeanceListClient seances={seances} />
    </section>
  );
}
