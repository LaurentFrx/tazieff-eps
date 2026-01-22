"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";

const cards = [
  {
    key: "catalogue",
    tagKey: "pages.exos.cards.catalogue.tag",
    titleKey: "pages.exos.cards.catalogue.title",
    bodyKey: "pages.exos.cards.catalogue.body",
  },
  {
    key: "focus",
    tagKey: "pages.exos.cards.focus.tag",
    titleKey: "pages.exos.cards.focus.title",
    bodyKey: "pages.exos.cards.focus.body",
  },
  {
    key: "quickset",
    tagKey: "pages.exos.cards.quickset.tag",
    titleKey: "pages.exos.cards.quickset.title",
    bodyKey: "pages.exos.cards.quickset.body",
  },
];

export default function ExosPage() {
  const { t } = useI18n();

  return (
    <section className="page">
      <header className="page-header">
        <p className="eyebrow">{t("pages.exos.eyebrow")}</p>
        <h1>{t("pages.exos.title")}</h1>
        <p className="lede">{t("pages.exos.lede")}</p>
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
