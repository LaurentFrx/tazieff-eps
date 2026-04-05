import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerLang, getServerT } from "@/lib/i18n/server";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { OBJECTIFS, getObjectifBySlug } from "@/lib/objectifs/data";
import { getAllMethodes } from "@/lib/content/fs";
import type { Lang } from "@/lib/i18n/messages";

/* ── locale-aware link prefix ─────────────────────────────────── */
const lp = (path: string, locale: string) =>
  locale === "fr" ? path : `/${locale}${path}`;

/* ── static params for the 3 slugs × 3 locales ───────────────── */
export function generateStaticParams() {
  const locales = ["fr", "en", "es"];
  return locales.flatMap((locale) =>
    OBJECTIFS.map((o) => ({ locale, slug: o.slug })),
  );
}

/* ── metadata ─────────────────────────────────────────────────── */
type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const lang = getServerLang(locale);
  const objectif = getObjectifBySlug(slug);
  if (!objectif) return {};
  const t = getServerT(lang);

  const names: Record<string, Record<Lang, string>> = {
    "endurance-de-force": { fr: "Endurance de force", en: "Strength Endurance", es: "Resistencia de fuerza" },
    "gain-de-volume": { fr: "Gain de volume", en: "Volume Gain", es: "Ganancia de volumen" },
    "gain-de-puissance": { fr: "Gain de puissance", en: "Power Gain", es: "Ganancia de potencia" },
  };

  const name = names[objectif.slug]?.[lang] ?? objectif.slug;
  return {
    title: `${name} \u2014 ${t("objectifs.title")} \u2014 Tazieff EPS`,
    description: objectif.principe[lang],
  };
}

/* ── param icons ──────────────────────────────────────────────── */
const PARAM_ICONS: Record<string, string> = {
  charge: "\uD83C\uDFCB\uFE0F",
  repetitions: "\uD83D\uDD04",
  series: "\uD83D\uDCCA",
  recuperation: "\u23F1\uFE0F",
  rythme: "\uD83C\uDFAF",
};

/* ── page ─────────────────────────────────────────────────────── */
export default async function ObjectifPage({ params }: Props) {
  const { locale, slug } = await params;
  const lang = getServerLang(locale);
  const t = getServerT(lang);
  const objectif = getObjectifBySlug(slug);
  if (!objectif) notFound();

  /* Resolve method names from MDX content */
  const allMethodes = await getAllMethodes(lang);
  const methodesMap = new Map(allMethodes.map((m) => [m.slug, m]));
  const matchedMethodes = objectif.methodesSlugs
    .map((s) => methodesMap.get(s))
    .filter(Boolean);

  const objectifNames: Record<string, Record<Lang, string>> = {
    "endurance-de-force": { fr: "Endurance de force", en: "Strength Endurance", es: "Resistencia de fuerza" },
    "gain-de-volume": { fr: "Gain de volume", en: "Volume Gain", es: "Ganancia de volumen" },
    "gain-de-puissance": { fr: "Gain de puissance", en: "Power Gain", es: "Ganancia de potencia" },
  };
  const objectifName = objectifNames[objectif.slug]?.[lang] ?? objectif.slug;

  const paramKeys = ["charge", "repetitions", "series", "recuperation", "rythme"] as const;

  return (
    <section className="page space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: t("nav.home.label"), href: "/" },
          { label: objectifName },
        ]}
      />

      {/* ── 1. Header coloré ──────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-2xl px-5 py-8 md:px-8 md:py-10 shadow-lg"
        style={{ background: objectif.gradient }}
      >
        <div className="relative z-10">
          <p className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-1">
            {t("objectifs.title")}
          </p>
          <h1
            className="text-3xl md:text-4xl font-extrabold text-white drop-shadow-sm"
            style={{ fontFamily: "var(--font-bebas), sans-serif" }}
          >
            {objectifName}
          </h1>
          <p className="mt-3 text-base text-white/90 leading-relaxed max-w-xl">
            {objectif.principe[lang]}
          </p>
        </div>
      </div>

      {/* ── 2. Paramètres essentiels ──────────────────────────── */}
      <div>
        <h2
          className="text-xl font-extrabold text-[color:var(--ink)] mb-4"
          style={{ fontFamily: "var(--font-bebas), sans-serif" }}
        >
          {t("objectifs.paramsSectionTitle")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {paramKeys.map((key) => (
            <div
              key={key}
              className="flex items-center gap-3 rounded-xl p-4 border"
              style={{
                backgroundColor: `${objectif.colorAccent}12`,
                borderColor: `${objectif.colorAccent}25`,
              }}
            >
              <span className="text-2xl shrink-0" aria-hidden="true">
                {PARAM_ICONS[key]}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[color:var(--muted)] uppercase tracking-wide">
                  {t(`objectifs.${key}`)}
                </p>
                <p className="text-base font-bold text-[color:var(--ink)]">
                  {objectif.params[key]}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. Description complémentaire ─────────────────────── */}
      <div>
        <h2
          className="text-xl font-extrabold text-[color:var(--ink)] mb-3"
          style={{ fontFamily: "var(--font-bebas), sans-serif" }}
        >
          {t("objectifs.descriptionTitle")}
        </h2>
        <p className="text-sm leading-relaxed text-[color:var(--muted)]">
          {objectif.description[lang]}
        </p>
      </div>

      {/* ── 4. Méthodes recommandées ──────────────────────────── */}
      {matchedMethodes.length > 0 && (
        <div>
          <h2
            className="text-xl font-extrabold text-[color:var(--ink)] mb-4"
            style={{ fontFamily: "var(--font-bebas), sans-serif" }}
          >
            {t("objectifs.methodsTitle")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {matchedMethodes.map((m) => (
              <a
                key={m!.slug}
                href={lp(`/methodes/${m!.slug}`, locale)}
                className="card flex flex-col gap-2 p-4 transition-colors hover:border-current"
                style={{ borderColor: `${objectif.colorAccent}30` }}
              >
                <p className="text-sm font-bold text-[color:var(--ink)]">
                  {m!.titre}
                </p>
                {m!.description && (
                  <p className="text-xs text-[color:var(--muted)] line-clamp-2">
                    {m!.description}
                  </p>
                )}
                <span
                  className="text-xs font-semibold mt-auto"
                  style={{ color: objectif.colorAccent }}
                >
                  {t("objectifs.methodsExplore")} →
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ── 5. CTA Exercices ──────────────────────────────────── */}
      <div className="pt-2 pb-4">
        <a
          href={lp("/exercices", locale)}
          className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:scale-[1.02]"
          style={{ background: objectif.gradient }}
        >
          {t("objectifs.ctaExercises")}
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </section>
  );
}
