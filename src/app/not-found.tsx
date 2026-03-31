import Link from "next/link";
import { getServerLang, getServerT } from "@/lib/i18n/server";

export default async function NotFound() {
  const lang = getServerLang();
  const t = getServerT(lang);

  return (
    <section className="page">
      <header className="page-header">
        <p className="eyebrow">404</p>
        <h1>{t("notFound.title")}</h1>
        <p className="lede">{t("notFound.body")}</p>
      </header>
      <Link className="primary-button" href="/">
        {t("offline.backHome")}
      </Link>
    </section>
  );
}
