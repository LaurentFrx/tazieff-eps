import Link from "next/link";
import { getServerLang, getServerT } from "@/lib/i18n/server";

export default async function ApprendrePage() {
  const lang = await getServerLang();
  const t = getServerT(lang);

  const cards = [
    {
      href: "/apprendre/parametres",
      title: t("pages.apprendre.cards.parametres.title"),
      description: t("pages.apprendre.cards.parametres.description"),
    },
    {
      href: "/apprendre/techniques",
      title: t("pages.apprendre.cards.techniques.title"),
      description: t("pages.apprendre.cards.techniques.description"),
    },
    {
      href: "/apprendre/connaissances",
      title: t("pages.apprendre.cards.connaissances.title"),
      description: t("pages.apprendre.cards.connaissances.description"),
    },
  ];

  return (
    <section className="page">
      <div className="card-grid">
        {cards.map((card) => (
          <Link key={card.href} href={card.href} className="card">
            <h2>{card.title}</h2>
            <p>{card.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
