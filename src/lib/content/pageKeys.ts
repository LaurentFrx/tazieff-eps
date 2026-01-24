export const PAGE_PATHS = {
  bac: "bac/bac.mdx",
  apprendre_parametres: "apprendre/parametres/index.mdx",
  apprendre_techniques: "apprendre/techniques/index.mdx",
  apprendre_connaissances: "apprendre/connaissances/index.mdx",
} as const;

export type PageKey = keyof typeof PAGE_PATHS;
