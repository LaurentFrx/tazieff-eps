import { cookies } from "next/headers";
import { seancesIndex } from "@/lib/content/fs";
import { SeanceListClient } from "@/app/seances/SeanceListClient";
import type { Lang } from "@/lib/i18n/messages";

const LANG_COOKIE = "eps_lang";

function getInitialLang(value?: string): Lang {
  if (value === "en" || value === "es") return value;
  return "fr";
}

export default async function SeancesPage() {
  const cookieStore = await cookies();
  const locale = getInitialLang(cookieStore.get(LANG_COOKIE)?.value);
  const seances = await seancesIndex(locale);

  return (
    <section className="page">
      <SeanceListClient seances={seances} />
    </section>
  );
}
