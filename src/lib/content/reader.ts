import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { compileMDX } from "next-mdx-remote/rsc";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import type { ReactNode } from "react";
import { z } from "zod";
import { mdxComponents } from "@/components/mdx/MDXComponents";
import { PAGE_PATHS, type PageKey } from "@/lib/content/pageKeys";

const CONTENT_ROOT = path.join(process.cwd(), "content");

const PageFrontmatterSchema = z
  .object({
    title: z.string().min(1, "Le titre est requis."),
    summary: z.string().min(1, "Le résumé est requis.").optional(),
    updatedAt: z.preprocess((value) => {
      if (value == null || value === "") {
        return undefined;
      }
      if (value instanceof Date) {
        return value.toISOString().slice(0, 10);
      }
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) {
          return trimmed.slice(0, 10);
        }
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
          return trimmed;
        }
        const frMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
        if (frMatch) {
          return `${frMatch[3]}-${frMatch[2]}-${frMatch[1]}`;
        }
        const dashMatch = /^(\d{2})-(\d{2})-(\d{4})$/.exec(trimmed);
        if (dashMatch) {
          return `${dashMatch[3]}-${dashMatch[2]}-${dashMatch[1]}`;
        }
        return trimmed;
      }
      return undefined;
    }, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide (YYYY-MM-DD).").optional()),
  })
  .passthrough();

export type PageFrontmatter = z.infer<typeof PageFrontmatterSchema>;

export type TocItem = {
  id: string;
  title: string;
  level: number;
};

export type PageMdx = {
  frontmatter: PageFrontmatter;
  content: ReactNode;
  toc: TocItem[];
  source: string;
};

function formatZodPath(pathSegments: Array<string | number>) {
  return pathSegments.reduce((acc, segment) => {
    if (typeof segment === "number") {
      return `${acc}[${segment}]`;
    }
    return acc ? `${acc}.${segment}` : segment;
  }, "");
}

function formatZodError(filename: string, issues: z.ZodIssue[]) {
  const details = issues
    .map((issue) => {
      const cleanedPath = issue.path.map((segment) =>
        typeof segment === "symbol" ? segment.toString() : segment,
      ) as Array<string | number>;
      const field = formatZodPath(cleanedPath) || "frontmatter";
      return `- ${field}: ${issue.message}`;
    })
    .join("\n");

  return `Frontmatter invalide dans ${filename}.\n${details}`;
}

function parseFrontmatter(
  data: Record<string, unknown>,
  filename: string,
): PageFrontmatter {
  const result = PageFrontmatterSchema.safeParse(data);

  if (!result.success) {
    throw new Error(formatZodError(filename, result.error.issues));
  }

  return result.data;
}

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

function extractToc(source: string): TocItem[] {
  const lines = source.split(/\r?\n/);
  const toc: TocItem[] = [];
  const counts = new Map<string, number>();
  let inCodeBlock = false;

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) {
      continue;
    }

    const match = /^(#{2,3})\s+(.+)$/.exec(line);
    if (!match) {
      continue;
    }

    const level = match[1].length;
    const title = match[2].replace(/\s+#+\s*$/, "").trim();
    if (!title) {
      continue;
    }

    toc.push({
      id: slugifyHeading(title, counts),
      title,
      level,
    });
  }

  return toc;
}

export async function renderPageMdx(source: string) {
  const { content } = await compileMDX({
    source,
    components: mdxComponents,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug],
      },
    },
  });

  return content;
}

export async function getPageMdx(key: PageKey): Promise<PageMdx> {
  const relativePath = PAGE_PATHS[key];
  const filePath = path.join(CONTENT_ROOT, relativePath);
  let raw = "";

  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      throw new Error(`Fichier MDX introuvable: content/${relativePath}`);
    }
    throw error;
  }

  const { data, content } = matter(raw);
  const filename = path.relative(process.cwd(), filePath);
  const frontmatter = parseFrontmatter(data as Record<string, unknown>, filename);
  const mdxContent = await renderPageMdx(content);

  return {
    frontmatter,
    content: mdxContent,
    toc: extractToc(content),
    source: content,
  };
}
