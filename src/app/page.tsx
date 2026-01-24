import Image from "next/image";
import Link from "next/link";
import flyer from "../../public/media/branding/flyer-eps.webp";

export default function HomePage() {
  const links = [
    {
      href: "/exercices",
      title: "Exercices",
      description: "Bibliothèque d’exercices avec filtres et favoris.",
    },
    {
      href: "/seances",
      title: "Séances",
      description: "Plans d’entraînement guidés pour progresser.",
    },
    {
      href: "/apprendre",
      title: "Apprendre",
      description: "Comprendre les paramètres, techniques et repères.",
    },
    {
      href: "/bac",
      title: "Bac",
      description: "Préparer l’épreuve et les attentes clés.",
    },
  ];

  return (
    <section className="page">
      <Image
        src={flyer}
        alt="Flyer EPS"
        priority
        sizes="100vw"
        className="w-full h-auto rounded-3xl"
      />
      <div className="card-grid">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="card">
            <h2>{link.title}</h2>
            <p>{link.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
