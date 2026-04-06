import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions l\u00e9gales \u2014 Tazieff EPS",
};

export default function MentionsLegalesPage() {
  return (
    <>
      <h1 className="mb-8 font-[family-name:var(--font-bebas)] text-4xl tracking-wide text-white">
        Mentions l&eacute;gales
      </h1>

      <section className="space-y-6">
        <div>
          <h2 className="mb-3 font-[family-name:var(--font-dm-sans)] text-lg font-bold text-white">
            &Eacute;diteur du site
          </h2>
          <p>
            Le site muscu-eps.fr est &eacute;dit&eacute; par{" "}
            Laurent Feroux, personne
            physique.
          </p>
          <p>
            Contact :{" "}
            contact@muscu-eps.fr
          </p>
          <p className="mt-3">
            En application de l&rsquo;article 6-III-2 de la loi n&deg;
            2004-575 du 21 juin 2004 pour la confiance dans
            l&rsquo;&eacute;conomie num&eacute;rique (LCEN),
            l&rsquo;&eacute;diteur, personne physique non professionnelle,
            n&rsquo;est pas tenu de publier son adresse personnelle. Ses
            coordonn&eacute;es sont communiqu&eacute;es &agrave;
            l&rsquo;h&eacute;bergeur.
          </p>
        </div>

        <div>
          <h2 className="mb-3 font-[family-name:var(--font-dm-sans)] text-lg font-bold text-white">
            H&eacute;bergement
          </h2>
          <p>L&rsquo;application est h&eacute;berg&eacute;e par&nbsp;:</p>
          <ul className="mt-2 list-['\2013\20'] space-y-1 pl-5 text-zinc-400">
            <li>
              Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA
              &mdash;{" "}
              <a
                href="https://vercel.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#00E5FF] hover:underline"
              >
                https://vercel.com
              </a>
            </li>
            <li>
              Base de donn&eacute;es : Supabase Inc., h&eacute;berg&eacute;e
              sur AWS r&eacute;gion eu-west-3 (Paris, France) &mdash;{" "}
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#00E5FF] hover:underline"
              >
                https://supabase.com
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-3 font-[family-name:var(--font-dm-sans)] text-lg font-bold text-white">
            Contenu p&eacute;dagogique
          </h2>
          <p>
            Le contenu p&eacute;dagogique (exercices, m&eacute;thodes
            d&rsquo;entra&icirc;nement, programmes, grilles
            d&rsquo;&eacute;valuation) est con&ccedil;u par
            l&rsquo;&eacute;quipe Tazieff&nbsp;EPS.
          </p>
        </div>

        <div>
          <h2 className="mb-3 font-[family-name:var(--font-dm-sans)] text-lg font-bold text-white">
            Propri&eacute;t&eacute; intellectuelle
          </h2>
          <p>
            L&rsquo;ensemble du contenu du site (textes p&eacute;dagogiques,
            illustrations, structure) est prot&eacute;g&eacute; par le droit
            d&rsquo;auteur. Toute reproduction, m&ecirc;me partielle, est
            soumise &agrave; autorisation pr&eacute;alable.
          </p>
          <p className="mt-3">
            Le code source de l&rsquo;application est la
            propri&eacute;t&eacute; de l&rsquo;&eacute;diteur.
          </p>
        </div>

        <div>
          <h2 className="mb-3 font-[family-name:var(--font-dm-sans)] text-lg font-bold text-white">
            Cr&eacute;dits techniques
          </h2>
          <p>
            Application web progressive (PWA) d&eacute;velopp&eacute;e avec
            Next.js, React, TypeScript et Tailwind CSS. D&eacute;ploiement
            automatis&eacute; via Vercel. Base de donn&eacute;es PostgreSQL via
            Supabase.
          </p>
        </div>
      </section>
    </>
  );
}
