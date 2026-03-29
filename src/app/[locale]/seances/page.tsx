import { seancesIndex } from "@/lib/content/fs";
import { SeanceListClient } from "@/app/[locale]/seances/SeanceListClient";
import { getServerLang } from "@/lib/i18n/server";
import type { Lang } from "@/lib/i18n/messages";

type Props = { params: Promise<{ locale: string }> };

export default async function SeancesPage({ params }: Props) {
  const { locale: localeParam } = await params;
  const locale = await getServerLang(localeParam as Lang);
  const seances = await seancesIndex(locale);

  return (
    <section className="page">
      <SeanceListClient seances={seances} />
    </section>
  );
}
