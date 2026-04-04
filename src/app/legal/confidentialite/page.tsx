import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialit\u00e9 \u2014 Tazieff EPS",
};

export default function ConfidentialitePage() {
  return (
    <>
      <h1 className="mb-8 font-[family-name:var(--font-bebas)] text-4xl tracking-wide text-white">
        Politique de confidentialit&eacute;
      </h1>

      <p className="mb-8 text-zinc-500">
        Derni&egrave;re mise &agrave; jour : 03/04/2026
      </p>

      <section className="space-y-8">
        {/* ── Responsable du traitement ─────────────────────────────── */}
        <div>
          <h2 className="mb-3 font-[family-name:var(--font-dm-sans)] text-lg font-bold text-white">
            Responsable du traitement
          </h2>
          <p>
            {/* TODO: remplacer [NOM_COMPLET] */}
            <span className="text-amber-400">[NOM_COMPLET]</span>
          </p>
          <p>
            Contact :{" "}
            {/* TODO: remplacer [EMAIL_CONTACT] */}
            <span className="text-amber-400">[EMAIL_CONTACT]</span>
          </p>
          <p className="mt-3">
            Cette politique d&eacute;crit comment muscu-eps.fr collecte,
            utilise et prot&egrave;ge vos donn&eacute;es personnelles,
            conform&eacute;ment au R&egrave;glement G&eacute;n&eacute;ral sur
            la Protection des Donn&eacute;es (RGPD &mdash; R&egrave;glement UE
            2016/679) et &agrave; la loi Informatique et Libert&eacute;s du 6
            janvier 1978 modifi&eacute;e.
          </p>
        </div>

        {/* ── Public concerné ──────────────────────────────────────── */}
        <div>
          <h2 className="mb-3 font-[family-name:var(--font-dm-sans)] text-lg font-bold text-white">
            Public concern&eacute;
          </h2>
          <p>
            L&rsquo;application s&rsquo;adresse principalement aux
            lyc&eacute;ens de 15 &agrave; 18 ans dans le cadre de l&rsquo;EPS
            (musculation). En France, les personnes de 15 ans et plus peuvent
            consentir elles-m&ecirc;mes au traitement de leurs donn&eacute;es
            personnelles (article 7-1 de la loi Informatique et
            Libert&eacute;s). Pour les utilisateurs de moins de 15 ans, le
            consentement d&rsquo;un repr&eacute;sentant l&eacute;gal est
            requis.
          </p>
        </div>

        {/* ── Données collectées ───────────────────────────────────── */}
        <div>
          <h2 className="mb-3 font-[family-name:var(--font-dm-sans)] text-lg font-bold text-white">
            Donn&eacute;es collect&eacute;es
          </h2>

          <h3 className="mb-2 mt-4 font-[family-name:var(--font-dm-sans)] text-[15px] font-semibold text-zinc-200">
            1. Utilisation sans compte (mode gratuit)
          </h3>
          <p>
            Aucune donn&eacute;e personnelle n&rsquo;est collect&eacute;e.
            L&rsquo;application stocke localement sur votre appareil
            (localStorage)&nbsp;:
          </p>
          <ul className="mt-2 list-['\2013\20'] space-y-1 pl-5 text-zinc-400">
            <li>Vos favoris (exercices sauvegard&eacute;s)</li>
            <li>Vos pr&eacute;f&eacute;rences (langue, th&egrave;me)</li>
            <li>Votre progression dans les checklists BAC</li>
            <li>
              Vos donn&eacute;es de s&eacute;ance (carnet
              d&rsquo;entra&icirc;nement local)
            </li>
          </ul>
          <p className="mt-3">
            Ces donn&eacute;es ne quittent jamais votre appareil et ne sont pas
            accessibles par l&rsquo;&eacute;diteur.
          </p>
          <p className="mt-3">
            Un identifiant technique anonyme peut &ecirc;tre cr&eacute;&eacute;
            par Supabase pour permettre le fonctionnement de certaines
            fonctionnalit&eacute;s. Cet identifiant ne permet pas de vous
            identifier personnellement.
          </p>

          <h3 className="mb-2 mt-6 font-[family-name:var(--font-dm-sans)] text-[15px] font-semibold text-zinc-200">
            2. Utilisation avec compte &eacute;tablissement (mode Pro)
          </h3>
          <p>
            Si votre &eacute;tablissement scolaire a souscrit une licence, les
            donn&eacute;es suivantes peuvent &ecirc;tre collect&eacute;es
            &nbsp;:
          </p>
          <ul className="mt-2 list-['\2013\20'] space-y-1 pl-5 text-zinc-400">
            <li>
              Adresse email (si connexion par magic link) ou code
              &eacute;tablissement
            </li>
            <li>
              Carnet d&rsquo;entra&icirc;nement synchronis&eacute; (exercices,
              charges, s&eacute;ries, dates)
            </li>
            <li>Identifiant de l&rsquo;&eacute;tablissement</li>
          </ul>
          <p className="mt-3">
            Ces donn&eacute;es sont stock&eacute;es sur Supabase (AWS,
            r&eacute;gion eu-west-3, Paris, France).
          </p>
        </div>

        {/* ── Finalités du traitement ──────────────────────────────── */}
        <div>
          <h2 className="mb-3 font-[family-name:var(--font-dm-sans)] text-lg font-bold text-white">
            Finalit&eacute;s du traitement
          </h2>
          <ul className="list-['\2013\20'] space-y-1 pl-5 text-zinc-400">
            <li>
              Fonctionnement de l&rsquo;application (stockage des
              pr&eacute;f&eacute;rences et du carnet)
            </li>
            <li>
              Synchronisation des donn&eacute;es entre appareils (mode Pro)
            </li>
            <li>
              Am&eacute;lioration du service (statistiques d&rsquo;usage
              anonymis&eacute;es)
            </li>
          </ul>
        </div>

        {/* ── Base légale ──────────────────────────────────────────── */}
        <div>
          <h2 className="mb-3 font-[family-name:var(--font-dm-sans)] text-lg font-bold text-white">
            Base l&eacute;gale
          </h2>
          <ul className="list-['\2013\20'] space-y-1 pl-5 text-zinc-400">
            <li>
              Consentement (article 6.1.a du RGPD) pour la cr&eacute;ation de
              compte et le stockage de donn&eacute;es personnelles
            </li>
            <li>
              Int&eacute;r&ecirc;t l&eacute;gitime (article 6.1.f du RGPD)
              pour les cookies strictement n&eacute;cessaires au fonctionnement
            </li>
          </ul>
        </div>

        {/* ── Sous-traitants ───────────────────────────────────────── */}
        <div>
          <h2 className="mb-3 font-[family-name:var(--font-dm-sans)] text-lg font-bold text-white">
            Sous-traitants
          </h2>
          <p>
            L&rsquo;&eacute;diteur fait appel aux sous-traitants suivants pour
            le fonctionnement du service&nbsp;:
          </p>
          <ul className="mt-2 list-['\2013\20'] space-y-2 pl-5 text-zinc-400">
            <li>
              <strong className="text-zinc-300">
                Supabase Inc. (San Francisco, USA)
              </strong>{" "}
              &mdash; Base de donn&eacute;es et authentification. Donn&eacute;es
              h&eacute;berg&eacute;es sur AWS eu-west-3 (Paris, France). DPA
              disponible sur{" "}
              <a
                href="https://supabase.com/legal/dpa"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#00E5FF] hover:underline"
              >
                https://supabase.com/legal/dpa
              </a>
              .
            </li>
            <li>
              <strong className="text-zinc-300">
                Vercel Inc. (Walnut, USA)
              </strong>{" "}
              &mdash; H&eacute;bergement et distribution du site web. CDN
              mondial avec Edge Network. DPA disponible sur{" "}
              <a
                href="https://vercel.com/legal/dpa"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#00E5FF] hover:underline"
              >
                https://vercel.com/legal/dpa
              </a>
              .
            </li>
          </ul>
          <p className="mt-3">
            Ces sous-traitants sont conformes au RGPD et les donn&eacute;es
            sont h&eacute;berg&eacute;es dans l&rsquo;Union Europ&eacute;enne
            (Paris, France) pour Supabase.
          </p>
        </div>

        {/* ── Cookies ──────────────────────────────────────────────── */}
        <div>
          <h2 className="mb-3 font-[family-name:var(--font-dm-sans)] text-lg font-bold text-white">
            Cookies
          </h2>
          <p>
            L&rsquo;application utilise uniquement des cookies techniques
            strictement n&eacute;cessaires &agrave; son fonctionnement&nbsp;:
          </p>
          <ul className="mt-2 list-['\2013\20'] space-y-1 pl-5 text-zinc-400">
            <li>
              Cookie d&rsquo;authentification Supabase (si compte Pro actif)
            </li>
            <li>
              Service Worker pour le fonctionnement hors-ligne (PWA)
            </li>
          </ul>
          <p className="mt-3">
            Aucun cookie publicitaire, de pistage ou d&rsquo;analyse
            comportementale n&rsquo;est utilis&eacute;. Aucun bandeau de
            consentement cookies n&rsquo;est donc requis.
          </p>
        </div>

        {/* ── Durée de conservation ────────────────────────────────── */}
        <div>
          <h2 className="mb-3 font-[family-name:var(--font-dm-sans)] text-lg font-bold text-white">
            Dur&eacute;e de conservation
          </h2>
          <ul className="list-['\2013\20'] space-y-1 pl-5 text-zinc-400">
            <li>
              Donn&eacute;es localStorage : tant que l&rsquo;utilisateur ne les
              supprime pas
            </li>
            <li>
              Compte Pro : donn&eacute;es conserv&eacute;es pendant la
              dur&eacute;e de la licence de l&rsquo;&eacute;tablissement, puis
              supprim&eacute;es dans les 30 jours suivant l&rsquo;expiration
            </li>
            <li>
              En cas de suppression de compte : donn&eacute;es
              supprim&eacute;es sous 30 jours
            </li>
          </ul>
        </div>

        {/* ── Vos droits ───────────────────────────────────────────── */}
        <div>
          <h2 className="mb-3 font-[family-name:var(--font-dm-sans)] text-lg font-bold text-white">
            Vos droits
          </h2>
          <p>
            Conform&eacute;ment au RGPD, vous disposez des droits
            suivants&nbsp;:
          </p>
          <ul className="mt-2 list-['\2013\20'] space-y-1 pl-5 text-zinc-400">
            <li>
              <strong className="text-zinc-300">Droit d&rsquo;acc&egrave;s</strong>{" "}
              : obtenir une copie de vos donn&eacute;es personnelles
            </li>
            <li>
              <strong className="text-zinc-300">Droit de rectification</strong>{" "}
              : corriger des donn&eacute;es inexactes
            </li>
            <li>
              <strong className="text-zinc-300">
                Droit &agrave; l&rsquo;effacement
              </strong>{" "}
              : demander la suppression de vos donn&eacute;es
            </li>
            <li>
              <strong className="text-zinc-300">
                Droit &agrave; la portabilit&eacute;
              </strong>{" "}
              : recevoir vos donn&eacute;es dans un format structur&eacute;
            </li>
            <li>
              <strong className="text-zinc-300">
                Droit d&rsquo;opposition
              </strong>{" "}
              : vous opposer au traitement de vos donn&eacute;es
            </li>
            <li>
              <strong className="text-zinc-300">
                Droit &agrave; la limitation
              </strong>{" "}
              : demander la restriction du traitement
            </li>
          </ul>
          <p className="mt-3">
            Pour exercer ces droits, contactez :{" "}
            {/* TODO: remplacer [EMAIL_CONTACT] */}
            <span className="text-amber-400">[EMAIL_CONTACT]</span>
          </p>
          <p className="mt-3">
            En cas de litige, vous pouvez introduire une r&eacute;clamation
            aupr&egrave;s de la CNIL (Commission Nationale de
            l&rsquo;Informatique et des Libert&eacute;s)&nbsp;:{" "}
            <a
              href="https://www.cnil.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#00E5FF] hover:underline"
            >
              https://www.cnil.fr
            </a>
          </p>
        </div>

        {/* ── Sécurité ─────────────────────────────────────────────── */}
        <div>
          <h2 className="mb-3 font-[family-name:var(--font-dm-sans)] text-lg font-bold text-white">
            S&eacute;curit&eacute;
          </h2>
          <p>Les donn&eacute;es sont prot&eacute;g&eacute;es par&nbsp;:</p>
          <ul className="mt-2 list-['\2013\20'] space-y-1 pl-5 text-zinc-400">
            <li>Chiffrement en transit (HTTPS/TLS)</li>
            <li>Chiffrement au repos (AES-256 sur Supabase/AWS)</li>
            <li>
              Politiques de s&eacute;curit&eacute; au niveau des lignes (Row
              Level Security) dans la base de donn&eacute;es
            </li>
            <li>
              Acc&egrave;s restreint aux donn&eacute;es de production
            </li>
          </ul>
        </div>

        {/* ── Transferts internationaux ────────────────────────────── */}
        <div>
          <h2 className="mb-3 font-[family-name:var(--font-dm-sans)] text-lg font-bold text-white">
            Transferts internationaux
          </h2>
          <p>
            Les donn&eacute;es personnelles stock&eacute;es dans Supabase sont
            h&eacute;berg&eacute;es en France (AWS eu-west-3, Paris). Vercel
            utilise un CDN mondial pour la distribution des pages statiques (qui
            ne contiennent pas de donn&eacute;es personnelles). Les fichiers
            statiques publics (images, contenu p&eacute;dagogique) peuvent
            &ecirc;tre mis en cache sur des serveurs situ&eacute;s en dehors de
            l&rsquo;UE via le CDN de Vercel, dans le cadre des clauses
            contractuelles types approuv&eacute;es par la Commission
            Europ&eacute;enne.
          </p>
        </div>

        {/* ── Modifications ────────────────────────────────────────── */}
        <div>
          <h2 className="mb-3 font-[family-name:var(--font-dm-sans)] text-lg font-bold text-white">
            Modifications
          </h2>
          <p>
            Cette politique peut &ecirc;tre mise &agrave; jour. La date de
            derni&egrave;re mise &agrave; jour est indiqu&eacute;e en haut de
            cette page. En cas de modification substantielle, les utilisateurs
            seront inform&eacute;s via l&rsquo;application.
          </p>
        </div>
      </section>
    </>
  );
}
