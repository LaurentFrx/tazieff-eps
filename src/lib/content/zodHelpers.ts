import type { ZodIssue } from "zod";

export function formatZodPath(pathSegments: Array<string | number>) {
  return pathSegments.reduce((acc, segment) => {
    if (typeof segment === "number") {
      return `${acc}[${segment}]`;
    }
    return acc ? `${acc}.${segment}` : segment;
  }, "");
}

export function formatZodError(filename: string, issues: ZodIssue[]) {
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
