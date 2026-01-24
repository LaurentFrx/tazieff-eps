import { getPageMdx } from "@/lib/content/reader";

export default async function TechniquesPage() {
  const { frontmatter, content, toc } = await getPageMdx("apprendre_techniques");
  const tocItems = toc.filter((item) => item.level === 2);

  return (
    <section className="page">
      <header className="page-header">
        <p className="eyebrow">Apprendre</p>
        <h1>{frontmatter.title}</h1>
        <p className="lede">{frontmatter.summary ?? "À compléter"}</p>
      </header>

      <nav className="card stack-md" aria-label="Sommaire">
        <h2>Sommaire</h2>
        <ul>
          {tocItems.map((item) => (
            <li key={item.id}>
              <a href={`#${item.id}`}>{item.title}</a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="stack-lg">{content}</div>
    </section>
  );
}
