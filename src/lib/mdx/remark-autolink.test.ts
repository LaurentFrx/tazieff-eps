import { describe, it, expect } from "vitest";
import { unified } from "unified";
import remarkParse from "remark-parse";
import { remarkAutolink } from "./remark-autolink";
import type { Root, Link, Text } from "mdast";

function parse(md: string): Root {
  const processor = unified().use(remarkParse).use(remarkAutolink);
  return processor.runSync(processor.parse(md)) as Root;
}

function findLinks(node: Root): Link[] {
  const links: Link[] = [];
  function walk(n: unknown) {
    if (!n || typeof n !== "object") return;
    const obj = n as { type?: string; children?: unknown[] };
    if (obj.type === "link") links.push(obj as unknown as Link);
    if (obj.children) obj.children.forEach(walk);
  }
  walk(node);
  return links;
}

describe("remarkAutolink", () => {
  it("links 'pectoraux' to anatomy page", () => {
    const tree = parse("Travaille tes pectoraux en supination.");
    const links = findLinks(tree);
    expect(links.length).toBe(1);
    expect(links[0].url).toBe("/apprendre/anatomie?muscles=pectoraux");
    expect((links[0].children[0] as Text).value).toBe("pectoraux");
  });

  it("does NOT link terms inside headings", () => {
    const tree = parse("## Les pectoraux\n\nTexte sur les pectoraux.");
    const links = findLinks(tree);
    // Should only link the one in paragraph, not in heading
    expect(links.length).toBe(1);
  });

  it("does NOT re-link terms already inside a link", () => {
    const tree = parse("Voir les [pectoraux](/custom-link) pour plus de détails sur les pectoraux.");
    const links = findLinks(tree);
    // The manual link + no autolink on the second occurrence (same key already linked by manual link...
    // actually the manual link is not autolinked, but the second occurrence should also not be linked
    // because the autolink only links FIRST occurrence, and the first is inside a manual link)
    // The manual link counts, and the second "pectoraux" should be auto-linked since the first was in a manual link
    // Actually, the plugin only tracks terms it HAS linked itself. The manual link is not tracked.
    // So the second "pectoraux" will be auto-linked.
    expect(links.length).toBe(2); // manual + autolink
  });

  it("only links the FIRST occurrence per term", () => {
    const tree = parse("Les biceps sont importants. Tes biceps sont forts. Les biceps au top.");
    const links = findLinks(tree);
    expect(links.length).toBe(1);
    expect(links[0].url).toBe("/apprendre/anatomie?muscles=membres-superieurs");
  });

  it("links method terms", () => {
    const tree = parse("Essaie le Drop Set pour progresser.");
    const links = findLinks(tree);
    expect(links.length).toBe(1);
    expect(links[0].url).toBe("/methodes/drop-set");
  });
});

describe("terms.ts", () => {
  it("all terms have valid href starting with /", async () => {
    const { GLOSSARY_TERMS } = await import("@/lib/glossary/terms");
    for (const term of GLOSSARY_TERMS) {
      expect(term.href).toMatch(/^\//);
    }
  });
});
