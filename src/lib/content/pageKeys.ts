export const PAGE_PATHS = {
  bac: "bac/bac.mdx",
  "apprendre/parametres": "apprendre/parametres/index.mdx",
  "apprendre/techniques": "apprendre/techniques/index.mdx",
  "apprendre/connaissances": "apprendre/connaissances/index.mdx",
} as const;

export type PageKey = keyof typeof PAGE_PATHS;
