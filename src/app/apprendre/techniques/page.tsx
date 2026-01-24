const sections = [
  { id: "section-1", title: "Section 1" },
  { id: "section-2", title: "Section 2" },
  { id: "section-3", title: "Section 3" },
];

export default function TechniquesPage() {
  return (
    <section className="page">
      <header className="page-header">
        <p className="eyebrow">Apprendre</p>
        <h1>Techniques d&apos;entraînement</h1>
        <p className="lede">À compléter</p>
      </header>

      <nav className="card stack-md" aria-label="Sommaire">
        <h2>Sommaire</h2>
        <ul>
          {sections.map((section) => (
            <li key={section.id}>
              <a href={`#${section.id}`}>{section.title}</a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="stack-lg">
        {sections.map((section) => (
          <section key={section.id} id={section.id} className="stack-md">
            <h2>{section.title}</h2>
            <ul>
              <li>À compléter</li>
            </ul>
          </section>
        ))}
      </div>
    </section>
  );
}
