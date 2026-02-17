import { getPageMdx, renderPageMdx } from "@/lib/content/reader";
import { getServerLang, getServerT } from "@/lib/i18n/server";

type BacCard = {
  title: string;
  body: string;
};

type BacSections = {
  headings: string[];
  sections: BacCard[][];
};

function slugifyHeading(value: string, counts: Map<string, number>) {
  const base = value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  const count = counts.get(base) ?? 0;
  counts.set(base, count + 1);

  return count === 0 ? base : `${base}-${count}`;
}

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

async function buildCards(items: BacCard[], incompleteLabel: string) {
  return Promise.all(
    items.map(async (item, index) => ({
      id: `${index}-${item.title}`,
      title: item.title || incompleteLabel,
      content: await renderPageMdx(item.body.trim() ? item.body : `- ${incompleteLabel}`),
    })),
  );
}

export default async function BacPage() {
  const lang = await getServerLang();
  const t = getServerT(lang);
  const { source } = await getPageMdx("bac");
  const { headings, sections } = splitBacSections(source);
  const fallbackHeadings = [t("bac.skills"), t("bac.projects"), t("bac.evaluation")];
  const resolvedHeadings = sections.map(
    (_, index) => headings[index] ?? fallbackHeadings[index] ?? `${t("bac.sectionFallback")} ${index + 1}`,
  );
  const incompleteLabel = t("bac.incomplete");
  const sectionCards = await Promise.all(sections.map((items) => buildCards(items, incompleteLabel)));
  const slugCounts = new Map<string, number>();

  return (
    <section className="page">
      <section className="stack-lg">
        {sectionCards.map((cards, index) => {
          const heading = resolvedHeadings[index];
          const headingId = heading
            ? slugifyHeading(heading, slugCounts)
            : undefined;

          return (
            <div key={`${heading}-${index}`} className="stack-md">
              {heading ? <h2 id={headingId}>{heading}</h2> : null}
              <div className="card-grid">
                {cards.map((card) => {
                  const title = card.title || incompleteLabel;
                  const cardId = card.title
                    ? slugifyHeading(card.title, slugCounts)
                    : undefined;

                  return (
                    <article key={card.id} className="card">
                      <h3 id={cardId}>{title}</h3>
                      <div className="stack-md">{card.content}</div>
                    </article>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>
    </section>
  );
}
