import Link from "next/link";
import { getServerLang, getServerT } from "@/lib/i18n/server";

export default async function OfflinePage() {
  const lang = await getServerLang();
  const t = getServerT(lang);

  return (
    <section className="page">
      <header className="page-header">
        <p className="eyebrow">{t("offline.eyebrow")}</p>
        <h1>{t("offline.title")}</h1>
        <p className="lede">{t("offline.lede")}</p>
      </header>
      <div className="card">
        <h2>{t("offline.tip")}</h2>
        <p>{t("offline.tipBody")}</p>
        <Link className="primary-button" href="/">
          {t("offline.backHome")}
        </Link>
      </div>
    </section>
  );
}
