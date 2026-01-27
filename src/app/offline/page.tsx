import Link from "next/link";

export default function OfflinePage() {
  return (
    <section className="page">
      <header className="page-header">
        <p className="eyebrow">Hors ligne</p>
        <h1>Connexion indisponible</h1>
        <p className="lede">
          Certaines fiches sont disponibles hors ligne. Vérifiez votre réseau pour
          continuer.
        </p>
      </header>
      <div className="card">
        <h2>Astuce</h2>
        <p>
          Ouvrez une séance déjà téléchargée ou revenez à l’accueil dès que la
          connexion est rétablie.
        </p>
        <Link className="primary-button" href="/">
          Retour à l’accueil
        </Link>
      </div>
    </section>
  );
}
