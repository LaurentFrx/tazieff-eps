import Link from "next/link";
import { getServerLang, getServerT } from "@/lib/i18n/server";

export default async function OfflinePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const lang = getServerLang(locale);
  const t = getServerT(lang);

  const cachedSections = [
    { href: "/exercices", label: t("nav.exos.label") },
    { href: "/seances", label: t("nav.seances.label") },
    { href: "/methodes", label: t("nav.methodes.label") },
    { href: "/apprendre", label: t("nav.apprendre.label") },
    { href: "/outils", label: t("nav.outils.label") },
    { href: "/parcours-bac", label: t("nav.bac.label") },
  ];

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
      </div>
      <div className="card">
        <h2>{t("offline.cachedSections")}</h2>
        <p>{t("offline.cachedSectionsBody")}</p>
        <div className="parcours-grille-links" style={{ marginTop: 12 }}>
          {cachedSections.map((s) => (
            <Link key={s.href} href={s.href} className="parcours-grille-link">
              {s.label}
            </Link>
          ))}
        </div>
      </div>
      <Link className="primary-button" href="/">
        {t("offline.backHome")}
      </Link>
    </section>
  );
}
