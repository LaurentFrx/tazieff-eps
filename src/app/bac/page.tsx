const competences = Array.from({ length: 4 }, (_, index) => ({
  id: `competence-${index + 1}`,
  title: `Compétence clé ${index + 1}`,
}));

const projets = Array.from({ length: 3 }, (_, index) => ({
  id: `projet-${index + 1}`,
  title: `Projet ${index + 1}`,
}));

export default function BacPage() {
  return (
    <section className="page">
      <header className="page-header">
        <p className="eyebrow">Bac</p>
        <h1>Musculation au BAC</h1>
        <p className="lede">À compléter</p>
      </header>

      <section className="stack-lg" aria-labelledby="bac-competences">
        <div className="stack-md">
          <h2 id="bac-competences">L’épreuve en 4 compétences clés</h2>
          <div className="card-grid">
            {competences.map((competence) => (
              <article key={competence.id} className="card">
                <h3>{competence.title}</h3>
                <ul>
                  <li>À compléter</li>
                </ul>
              </article>
            ))}
          </div>
        </div>

        <div className="stack-md">
          <h2>3 projets d’entraînement</h2>
          <div className="card-grid">
            {projets.map((projet) => (
              <article key={projet.id} className="card">
                <h3>{projet.title}</h3>
                <ul>
                  <li>À compléter</li>
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>
    </section>
  );
}
