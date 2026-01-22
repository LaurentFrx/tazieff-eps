"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";

const cards = [
  {
    key: "basics",
    tagKey: "pages.apprendre.cards.basics.tag",
    titleKey: "pages.apprendre.cards.basics.title",
    bodyKey: "pages.apprendre.cards.basics.body",
  },
  {
    key: "guides",
    tagKey: "pages.apprendre.cards.guides.tag",
    titleKey: "pages.apprendre.cards.guides.title",
    bodyKey: "pages.apprendre.cards.guides.body",
  },
  {
    key: "glossary",
    tagKey: "pages.apprendre.cards.glossary.tag",
    titleKey: "pages.apprendre.cards.glossary.title",
    bodyKey: "pages.apprendre.cards.glossary.body",
  },
];

export default function ApprendrePage() {
  const { t } = useI18n();

  return (
    <section className="page">
      <header className="page-header">
        <p className="eyebrow">{t("pages.apprendre.eyebrow")}</p>
        <h1>{t("pages.apprendre.title")}</h1>
        <p className="lede">{t("pages.apprendre.lede")}</p>
      </header>
      <div className="card-grid">
        {cards.map((card) => (
          <article key={card.key} className="card">
            <span className="pill">{t(card.tagKey)}</span>
            <h2>{t(card.titleKey)}</h2>
            <p>{t(card.bodyKey)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
