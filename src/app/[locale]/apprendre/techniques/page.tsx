import { getPageMdx } from "@/lib/content/reader";
import { getServerLang, getServerT } from "@/lib/i18n/server";
import type { Lang } from "@/lib/i18n/messages";

type Props = { params: Promise<{ locale: string }> };

export default async function TechniquesPage({ params }: Props) {
  const { locale } = await params;
  const lang = await getServerLang(locale as Lang);
  const t = getServerT(lang);
  const { frontmatter, content, toc } = await getPageMdx("apprendre_techniques");
  const tocItems = toc.filter((item) => item.level === 2);

  return (
    <section className="page">
      <header className="page-header">
        <p className="eyebrow">{t("apprendre.eyebrow")}</p>
        <h1>{frontmatter.title}</h1>
        <p className="lede">{frontmatter.summary ?? t("apprendre.incomplete")}</p>
      </header>

      <nav className="card stack-md" aria-label={t("apprendre.toc")}>
        <h2>{t("apprendre.toc")}</h2>
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
