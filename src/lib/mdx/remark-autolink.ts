/**
 * Remark plugin: auto-link glossary terms in MDX content.
 *
 * - Case-insensitive match with French accent support
 * - Only links the FIRST occurrence per term per document
 * - Skips terms inside headings, links, code, inlineCode
 * - Terms matched longest-first to avoid partial matches
 */

import type { Root, Text, PhrasingContent, Parent } from "mdast";
import { GLOSSARY_TERMS } from "@/lib/glossary/terms";

const SKIP_PARENTS = new Set(["heading", "link", "code", "inlineCode", "strong"]);

/** Word boundary for French text (handles accents, hyphens) */
function buildPattern(term: string): RegExp {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Word boundary: start of string or whitespace/punctuation, same at end
  const before = "(?<=^|[\\s,.;:!?()\\[\\]«»\"'—–/])";
  const after = "(?=$|[\\s,.;:!?()\\[\\]«»\"'—–/])";
  return new RegExp(`${before}${escaped}${after}`, "i");
}

/** All patterns, sorted by term length DESC (longest first) */
const PATTERNS = GLOSSARY_TERMS.flatMap((entry) => {
  const all = [entry.term, ...entry.variants];
  return all.map((variant) => ({
    pattern: buildPattern(variant),
    href: entry.href,
    tooltip: entry.tooltip,
    key: entry.term, // dedup key
  }));
}).sort((a, b) => {
  // Longer patterns first
  const aLen = a.pattern.source.length;
  const bLen = b.pattern.source.length;
  return bLen - aLen;
});

export function remarkAutolink() {
  return (tree: Root) => {
    const linked = new Set<string>();

    function visitNode(node: Parent) {
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];

        // Recurse into non-skip containers
        if ("children" in child && !SKIP_PARENTS.has(child.type)) {
          visitNode(child as Parent);
          continue;
        }

        // Only process text nodes
        if (child.type !== "text") continue;

        // Skip if parent is a skip type
        if (SKIP_PARENTS.has(node.type)) continue;

        const text = child as Text;
        const replacement = processText(text.value, linked);
        if (replacement) {
          node.children.splice(i, 1, ...replacement);
          i += replacement.length - 1;
        }
      }
    }

    visitNode(tree);
  };
}

function processText(
  text: string,
  linked: Set<string>,
): PhrasingContent[] | null {
  for (const { pattern, href, tooltip, key } of PATTERNS) {
    if (linked.has(key)) continue;

    const match = pattern.exec(text);
    if (!match) continue;

    linked.add(key);
    const start = match.index;
    const end = start + match[0].length;

    const result: PhrasingContent[] = [];

    if (start > 0) {
      result.push({ type: "text", value: text.slice(0, start) });
    }

    result.push({
      type: "link",
      url: href,
      title: tooltip,
      data: { hProperties: { className: "autolink" } },
      children: [{ type: "text", value: match[0] }],
    });

    if (end < text.length) {
      // Recursively process the remainder for other terms
      const rest = processText(text.slice(end), linked);
      if (rest) {
        result.push(...rest);
      } else {
        result.push({ type: "text", value: text.slice(end) });
      }
    }

    return result;
  }

  return null;
}
