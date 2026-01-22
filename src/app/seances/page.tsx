const cards = [
  {
    title: "Weekly map",
    tag: "Plan",
    body: "Sketch a simple week with clear focus days.",
  },
  {
    title: "Session flow",
    tag: "Tempo",
    body: "Keep warmup, work, and cooldown in one flow.",
  },
  {
    title: "Notes",
    tag: "Log",
    body: "Add short notes to keep the next session sharp.",
  },
];

export default function SeancesPage() {
  return (
    <section className="page">
      <header className="page-header">
        <p className="eyebrow">Seances</p>
        <h1>Plan simple sessions</h1>
        <p className="lede">
          Keep a light structure so each session feels repeatable.
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
