const cards = [
  {
    title: "Basics",
    tag: "Start",
    body: "Short explainers for form, tempo, and recovery.",
  },
  {
    title: "Guides",
    tag: "Focus",
    body: "Deep dives for specific goals and techniques.",
  },
  {
    title: "Glossary",
    tag: "Terms",
    body: "Quick definitions to keep language consistent.",
  },
];

export default function ApprendrePage() {
  return (
    <section className="page">
      <header className="page-header">
        <p className="eyebrow">Apprendre</p>
        <h1>Learn the essentials</h1>
        <p className="lede">
          Build confidence with short lessons you can scan in minutes.
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
