import { getPageMdx, renderPageMdx } from "@/lib/content/reader";

type BacCard = {
  title: string;
  body: string;
};

type BacSections = {
  headings: string[];
  sections: BacCard[][];
};

function splitBacSections(source: string): BacSections {
  const lines = source.split(/\r?\n/);
  const headings: string[] = [];
  const sections: BacCard[][] = [];
  let sectionIndex = -1;
  let currentCard: BacCard | null = null;
  let buffer: string[] = [];

  const flush = () => {
    if (!currentCard) {
      return;
    }
    currentCard.body = buffer.join("\n").trim();
    buffer = [];
  };

  for (const line of lines) {
    const h2Match = /^##\s+(.+)$/.exec(line);
    if (h2Match) {
      flush();
      currentCard = null;
      sectionIndex += 1;
      headings[sectionIndex] = h2Match[1].trim();
      if (!sections[sectionIndex]) {
        sections[sectionIndex] = [];
      }
      continue;
    }

    const h3Match = /^###\s+(.+)$/.exec(line);
    if (h3Match && sectionIndex >= 0) {
      flush();
      currentCard = {
        title: h3Match[1].trim(),
        body: "",
      };
      sections[sectionIndex].push(currentCard);
      continue;
    }

    if (currentCard) {
      buffer.push(line);
    }
  }

  flush();

  return { headings, sections };
}

async function buildCards(items: BacCard[]) {
  return Promise.all(
    items.map(async (item, index) => ({
      id: `${index}-${item.title}`,
      title: item.title || "À compléter",
      content: await renderPageMdx(item.body.trim() ? item.body : "- À compléter"),
    })),
  );
}

export default async function BacPage() {
  const { frontmatter, source } = await getPageMdx("bac");
  const { headings, sections } = splitBacSections(source);
  const competences = await buildCards(sections[0] ?? []);
  const projets = await buildCards(sections[1] ?? []);

  return (
    <section className="page">
      <header className="page-header">
        <p className="eyebrow">Bac</p>
        <h1>{frontmatter.title}</h1>
        <p className="lede">{frontmatter.summary ?? "À compléter"}</p>
      </header>

      <section className="stack-lg" aria-labelledby="bac-competences">
        <div className="stack-md">
          <h2 id="bac-competences">
            {headings[0] ?? "L’épreuve en 4 compétences clés"}
          </h2>
          <div className="card-grid">
            {competences.map((competence) => (
              <article key={competence.id} className="card">
                <h3>{competence.title}</h3>
                <div className="stack-md">{competence.content}</div>
              </article>
            ))}
          </div>
        </div>

        <div className="stack-md">
          <h2>{headings[1] ?? "3 projets d’entraînement"}</h2>
          <div className="card-grid">
            {projets.map((projet) => (
              <article key={projet.id} className="card">
                <h3>{projet.title}</h3>
                <div className="stack-md">{projet.content}</div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </section>
  );
}
