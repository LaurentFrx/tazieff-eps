import type { Metadata } from "next";
import { LocaleLink } from "@/components/LocaleLink";

export const metadata: Metadata = {
  title: "Conditions G\u00e9n\u00e9rales d\u2019Utilisation \u2014 Tazieff EPS",
};

export default function CguPage() {
  return (
    <>
      <h1 className="mb-8 font-[family-name:var(--font-bebas)] text-4xl tracking-wide text-white">
        Conditions G&eacute;n&eacute;rales d&rsquo;Utilisation
      </h1>

      <p className="mb-8 text-zinc-500">
        Derni&egrave;re mise &agrave; jour : 03/04/2026
      </p>

      <section className="space-y-8">
        {/* ── Article 1 ────────────────────────────────────────────── */}
        <div>
          <h2 className="mb-3 font-[family-name:var(--font-dm-sans)] text-lg font-bold text-white">
            Article 1 &mdash; Objet
          </h2>
          <p>
            Les pr&eacute;sentes Conditions G&eacute;n&eacute;rales
            d&rsquo;Utilisation (CGU) r&eacute;gissent l&rsquo;acc&egrave;s et
            l&rsquo;utilisation de l&rsquo;application web muscu-eps.fr
            (ci-apr&egrave;s &laquo;&nbsp;l&rsquo;Application&nbsp;&raquo;),
            &eacute;dit&eacute;e par{" "}
            Laurent Feroux.
          </p>
          <p className="mt-3">
            L&rsquo;Application est un outil p&eacute;dagogique
            d&rsquo;accompagnement en musculation, destin&eacute; aux
            lyc&eacute;ens dans le cadre de l&rsquo;&Eacute;ducation Physique
            et Sportive (EPS).
          </p>
        </div>

        {/* ── Article 2 ────────────────────────────────────────────── */}
        <div>
          <h2 className="mb-3 font-[family-name:var(--font-dm-sans)] text-lg font-bold text-white">
            Article 2 &mdash; Acc&egrave;s au service
          </h2>
          <p>
            L&rsquo;acc&egrave;s au contenu p&eacute;dagogique de
            l&rsquo;Application (exercices, m&eacute;thodes
            d&rsquo;entra&icirc;nement, contenus th&eacute;oriques, parcours
            BAC) est gratuit et ne n&eacute;cessite aucune inscription.
          </p>
          <p className="mt-3">
            Certaines fonctionnalit&eacute;s avanc&eacute;es (carnet
            d&rsquo;entra&icirc;nement synchronis&eacute;, suivi de
            progression) peuvent n&eacute;cessiter un compte li&eacute; &agrave;
            un &eacute;tablissement scolaire disposant d&rsquo;une licence
            active.
          </p>
          <p className="mt-3">
            L&rsquo;&eacute;diteur se r&eacute;serve le droit de modifier,
            suspendre ou interrompre tout ou partie du service, sans
            pr&eacute;avis ni indemnit&eacute;.
          </p>
        </div>

        {/* ── Article 3 ────────────────────────────────────────────── */}
        <div>
          <h2 className="mb-3 font-[family-name:var(--font-dm-sans)] text-lg font-bold text-white">
            Article 3 &mdash; Utilisation de l&rsquo;Application
          </h2>
          <p>
            L&rsquo;utilisateur s&rsquo;engage &agrave; utiliser
            l&rsquo;Application conform&eacute;ment &agrave; sa
            finalit&eacute; p&eacute;dagogique et dans le respect de la
            l&eacute;gislation en vigueur.
          </p>
          <p className="mt-3">Il est interdit&nbsp;:</p>
          <ul className="mt-2 list-['\2013\20'] space-y-1 pl-5 text-zinc-400">
            <li>
              D&rsquo;utiliser l&rsquo;Application &agrave; des fins
              commerciales sans autorisation
            </li>
            <li>
              De tenter d&rsquo;acc&eacute;der aux donn&eacute;es d&rsquo;autres
              utilisateurs
            </li>
            <li>
              De contourner les mesures de s&eacute;curit&eacute; de
              l&rsquo;Application
            </li>
            <li>
              De reproduire ou distribuer le contenu sans autorisation
            </li>
          </ul>
        </div>

        {/* ── Article 4 ────────────────────────────────────────────── */}
        <div>
          <h2 className="mb-3 font-[family-name:var(--font-dm-sans)] text-lg font-bold text-white">
            Article 4 &mdash; Propri&eacute;t&eacute; intellectuelle
          </h2>
          <p>
            Le contenu p&eacute;dagogique de l&rsquo;Application (exercices,
            m&eacute;thodes, programmes, illustrations, grilles
            d&rsquo;&eacute;valuation) est la propri&eacute;t&eacute;
            intellectuelle de l&rsquo;&eacute;diteur. Toute reproduction,
            repr&eacute;sentation ou diffusion, m&ecirc;me partielle, est
            interdite sans autorisation &eacute;crite pr&eacute;alable.
          </p>
          <p className="mt-3">
            Le code source, le design et l&rsquo;architecture technique de
            l&rsquo;Application sont la propri&eacute;t&eacute; de
            l&rsquo;&eacute;diteur.
          </p>
          <p className="mt-3">
            Les marques, logos et noms de domaine sont la
            propri&eacute;t&eacute; de leurs titulaires respectifs.
          </p>
        </div>

        {/* ── Article 5 ────────────────────────────────────────────── */}
        <div>
          <h2 className="mb-3 font-[family-name:var(--font-dm-sans)] text-lg font-bold text-white">
            Article 5 &mdash; Avertissement sant&eacute;
          </h2>
          <p>
            L&rsquo;Application fournit des informations &agrave;
            caract&egrave;re p&eacute;dagogique sur la musculation dans le
            cadre de l&rsquo;EPS. Ces informations ne se substituent en aucun
            cas &agrave; l&rsquo;encadrement d&rsquo;un enseignant d&rsquo;EPS
            qualifi&eacute;, ni &agrave; un avis m&eacute;dical.
          </p>
          <p className="mt-3">
            L&rsquo;utilisateur est invit&eacute; &agrave; consulter un
            m&eacute;decin avant de d&eacute;buter ou modifier un programme
            d&rsquo;entra&icirc;nement. L&rsquo;&eacute;diteur d&eacute;cline
            toute responsabilit&eacute; en cas de blessure r&eacute;sultant
            d&rsquo;une utilisation de l&rsquo;Application sans encadrement
            p&eacute;dagogique adapt&eacute;.
          </p>
        </div>

        {/* ── Article 6 ────────────────────────────────────────────── */}
        <div>
          <h2 className="mb-3 font-[family-name:var(--font-dm-sans)] text-lg font-bold text-white">
            Article 6 &mdash; Donn&eacute;es personnelles
          </h2>
          <p>
            Le traitement des donn&eacute;es personnelles est d&eacute;crit
            dans la Politique de confidentialit&eacute;, accessible &agrave;
            l&rsquo;adresse&nbsp;:{" "}
            <LocaleLink
              href="/legal/confidentialite"
              className="text-[#00E5FF] hover:underline"
            >
              muscu-eps.fr/legal/confidentialite
            </LocaleLink>
          </p>
        </div>

        {/* ── Article 7 ────────────────────────────────────────────── */}
        <div>
          <h2 className="mb-3 font-[family-name:var(--font-dm-sans)] text-lg font-bold text-white">
            Article 7 &mdash; Responsabilit&eacute;
          </h2>
          <p>
            L&rsquo;&eacute;diteur s&rsquo;efforce d&rsquo;assurer
            l&rsquo;exactitude du contenu p&eacute;dagogique, en collaboration
            avec des enseignants d&rsquo;EPS qualifi&eacute;s. Toutefois, il
            ne garantit pas l&rsquo;absence d&rsquo;erreurs ou
            d&rsquo;omissions.
          </p>
          <p className="mt-3">
            L&rsquo;Application est fournie
            &laquo;&nbsp;en l&rsquo;&eacute;tat&nbsp;&raquo;.
            L&rsquo;&eacute;diteur ne saurait &ecirc;tre tenu
            responsable&nbsp;:
          </p>
          <ul className="mt-2 list-['\2013\20'] space-y-1 pl-5 text-zinc-400">
            <li>Des interruptions ou dysfonctionnements du service</li>
            <li>
              De l&rsquo;inad&eacute;quation du service aux besoins
              particuliers de l&rsquo;utilisateur
            </li>
            <li>
              Des dommages directs ou indirects r&eacute;sultant de
              l&rsquo;utilisation de l&rsquo;Application
            </li>
          </ul>
        </div>

        {/* ── Article 8 ────────────────────────────────────────────── */}
        <div>
          <h2 className="mb-3 font-[family-name:var(--font-dm-sans)] text-lg font-bold text-white">
            Article 8 &mdash; Liens hypertextes
          </h2>
          <p>
            L&rsquo;Application peut contenir des liens vers des sites tiers.
            L&rsquo;&eacute;diteur n&rsquo;exerce aucun contr&ocirc;le sur ces
            sites et d&eacute;cline toute responsabilit&eacute; quant &agrave;
            leur contenu.
          </p>
        </div>

        {/* ── Article 9 ────────────────────────────────────────────── */}
        <div>
          <h2 className="mb-3 font-[family-name:var(--font-dm-sans)] text-lg font-bold text-white">
            Article 9 &mdash; Modification des CGU
          </h2>
          <p>
            L&rsquo;&eacute;diteur se r&eacute;serve le droit de modifier les
            pr&eacute;sentes CGU &agrave; tout moment. Les modifications
            prennent effet d&egrave;s leur publication sur
            l&rsquo;Application. L&rsquo;utilisation continue de
            l&rsquo;Application apr&egrave;s modification vaut acceptation des
            nouvelles CGU.
          </p>
        </div>

        {/* ── Article 10 ───────────────────────────────────────────── */}
        <div>
          <h2 className="mb-3 font-[family-name:var(--font-dm-sans)] text-lg font-bold text-white">
            Article 10 &mdash; Droit applicable
          </h2>
          <p>
            Les pr&eacute;sentes CGU sont r&eacute;gies par le droit
            fran&ccedil;ais. Tout litige relatif &agrave;
            l&rsquo;interpr&eacute;tation ou l&rsquo;ex&eacute;cution des
            pr&eacute;sentes sera soumis aux tribunaux comp&eacute;tents de
            Dax (Landes).
          </p>
        </div>
      </section>
    </>
  );
}
