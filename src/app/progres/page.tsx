const cards = [
  {
    title: "Check-ins",
    tag: "Track",
    body: "Log strength and effort to see trends over time.",
  },
  {
    title: "Milestones",
    tag: "Goals",
    body: "Set small wins and review them weekly.",
  },
  {
    title: "Insights",
    tag: "Review",
    body: "Spot patterns and adjust the plan with confidence.",
  },
];

export default function ProgresPage() {
  return (
    <section className="page">
      <header className="page-header">
        <p className="eyebrow">Progres</p>
        <h1>Track your momentum</h1>
        <p className="lede">
          Keep a clear view of wins and the next step forward.
        </p>
      </header>
      <div className="card-grid">
        {cards.map((card) => (
          <article key={card.title} className="card">
            <span className="pill">{card.tag}</span>
            <h2>{card.title}</h2>
            <p>{card.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
