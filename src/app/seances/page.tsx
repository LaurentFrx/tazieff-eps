"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";

const cards = [
  {
    key: "weekly",
    tagKey: "pages.seances.cards.weekly.tag",
    titleKey: "pages.seances.cards.weekly.title",
    bodyKey: "pages.seances.cards.weekly.body",
  },
  {
    key: "flow",
    tagKey: "pages.seances.cards.flow.tag",
    titleKey: "pages.seances.cards.flow.title",
    bodyKey: "pages.seances.cards.flow.body",
  },
  {
    key: "notes",
    tagKey: "pages.seances.cards.notes.tag",
    titleKey: "pages.seances.cards.notes.title",
    bodyKey: "pages.seances.cards.notes.body",
  },
];

export default function SeancesPage() {
  const { t } = useI18n();

  return (
    <section className="page">
      <header className="page-header">
        <p className="eyebrow">{t("pages.seances.eyebrow")}</p>
        <h1>{t("pages.seances.title")}</h1>
        <p className="lede">{t("pages.seances.lede")}</p>
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
