const cards = [
  {
    title: "Catalogue",
    tag: "Library",
    body: "Browse a clear list of moves and build your set.",
  },
  {
    title: "Focus",
    tag: "Target",
    body: "Filter by goal, equipment, or intensity.",
  },
  {
    title: "Quick set",
    tag: "Build",
    body: "Draft a short block and keep the pace steady.",
  },
];

export default function ExosPage() {
  return (
    <section className="page">
      <header className="page-header">
        <p className="eyebrow">Exos</p>
        <h1>Build strong training blocks</h1>
        <p className="lede">
          Start with a focused list of moves and keep sessions simple.
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
