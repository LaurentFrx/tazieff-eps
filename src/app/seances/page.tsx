import Link from "next/link";
import { listMdx } from "@/lib/content/fs";

export default async function SeancesPage() {
  const seances = await listMdx("seances");

  return (
    <section className="page">
      <header className="page-header">
        <p className="eyebrow">Séances</p>
        <h1>Plans de séance</h1>
        <p className="lede">
          Des modèles prêts à l&apos;emploi pour structurer une séance complète.
        </p>
      </header>
      <div className="card-grid">
        {seances.length === 0 ? (
          <div className="card">
            <h2>Aucune séance pour le moment</h2>
            <p>Ajoutez un fichier MDX pour enrichir la bibliothèque.</p>
          </div>
        ) : (
          seances.map((seance) => (
            <Link key={seance.slug} href={`/seances/${seance.slug}`}>
              <article className="card">
                <span className="pill">
                  {seance.durationMin ? `${seance.durationMin} min` : "Séance"}
                  {seance.level ? ` · ${seance.level}` : ""}
                </span>
                <h2>{seance.title}</h2>
                <p>
                  {(seance.tags ?? []).length > 0
                    ? `Tags: ${seance.tags?.join(", ")}`
                    : "Plan structuré avec objectifs clairs."}
                </p>
              </article>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}
