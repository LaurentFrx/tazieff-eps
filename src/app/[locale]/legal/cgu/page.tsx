// Sprint P0.7-octies — Re-export de /legal/cgu pour rendre la route
// disponible sous /[locale]/legal/cgu. Les liens du footer (LocaleLink)
// préfixent automatiquement avec la locale courante (post P0.7-quater).
//
// Le contenu pédagogique est en français pour l'instant (à traduire dans
// un sprint i18n dédié si besoin). La route /legal/cgu (sans préfixe locale)
// reste accessible pour les liens externes existants.

export { default, metadata } from "@/app/legal/cgu/page";
