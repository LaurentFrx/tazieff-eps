"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";

const cards = [
  {
    key: "checkins",
    tagKey: "pages.progres.cards.checkins.tag",
    titleKey: "pages.progres.cards.checkins.title",
    bodyKey: "pages.progres.cards.checkins.body",
  },
  {
    key: "milestones",
    tagKey: "pages.progres.cards.milestones.tag",
    titleKey: "pages.progres.cards.milestones.title",
    bodyKey: "pages.progres.cards.milestones.body",
  },
  {
    key: "insights",
    tagKey: "pages.progres.cards.insights.tag",
    titleKey: "pages.progres.cards.insights.title",
    bodyKey: "pages.progres.cards.insights.body",
  },
];

export default function ProgresPage() {
  const { t } = useI18n();

  return (
    <section className="page">
      <header className="page-header">
        <p className="eyebrow">{t("pages.progres.eyebrow")}</p>
        <h1>{t("pages.progres.title")}</h1>
        <p className="lede">{t("pages.progres.lede")}</p>
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
