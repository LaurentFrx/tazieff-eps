import Link from "next/link";

const cards = [
  {
    href: "/apprendre/parametres",
    title: "Paramètres",
    description: "Par thème",
  },
  {
    href: "/apprendre/techniques",
    title: "Techniques d'entraînement",
    description: "À compléter",
  },
  {
    href: "/apprendre/connaissances",
    title: "Connaissances",
    description: "À compléter",
  },
];

export default function ApprendrePage() {
  return (
    <section className="page">
      <header className="page-header">
        <p className="eyebrow">Apprendre</p>
        <h1>Apprendre</h1>
        <p className="lede">À compléter</p>
      </header>
      <div className="card-grid">
        {cards.map((card) => (
          <Link key={card.href} href={card.href} className="card">
            <h2>{card.title}</h2>
            <p>{card.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
