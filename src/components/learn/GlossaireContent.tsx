"use client";

import { LearnGlossary } from "@/components/learn/LearnGlossary";

const TERMS = [
  { term: "RM — Répétition Maximale", definition: "La charge maximale que tu peux soulever pour un nombre précis de répétitions avec une technique correcte. Le 1RM est la charge maximale pour une seule répétition.", link: "/apprendre/rm-rir-rpe" },
  { term: "RIR — Reps In Reserve", definition: "Le nombre de répétitions que tu pourrais encore faire avant l’échec musculaire. Un RIR 2 signifie que tu aurais pu faire 2 reps de plus.", link: "/apprendre/rm-rir-rpe" },
  { term: "RPE — Rating of Perceived Exertion", definition: "Échelle subjective de 1 à 10 qui évalue la difficulté globale ressentie durant une série. Un RPE 8 correspond à une série difficile.", link: "/apprendre/rm-rir-rpe" },
  { term: "Répétition (Rep)", definition: "Un mouvement complet d’un exercice, de la position de départ au retour. Une montée + une descente au curl = 1 répétition.", link: "/apprendre/parametres" },
  { term: "Série", definition: "Un ensemble de répétitions effectuées sans pause. 3 séries de 10 = 3×10 reps avec repos entre chaque.", link: "/apprendre/parametres" },
  { term: "Intensité", definition: "Le niveau d’effort par rapport à ta capacité maximale. S’exprime en pourcentage du 1RM ou via le RPE/RIR.", link: "/apprendre/parametres" },
  { term: "Volume", definition: "Quantité totale de travail : séries × répétitions × charge. Un volume progressif est clé pour la progression.", link: "/apprendre/parametres" },
  { term: "Récupération", definition: "Temps de repos entre deux séries. Varie de 30s (endurance) à 5 min (puissance) selon l’objectif.", link: "/apprendre/parametres" },
  { term: "Agoniste", definition: "Le muscle principal qui produit le mouvement en se contractant. Le biceps est agoniste lors de la flexion du coude.", link: "/apprendre/muscles" },
  { term: "Antagoniste", definition: "Le muscle opposé à l’agoniste, qui s’étire pour permettre le mouvement. Le triceps est antagoniste lors de la flexion du coude.", link: "/apprendre/muscles" },
  { term: "Exercice d’isolation", definition: "Exercice ciblant un seul muscle via une seule articulation. Curl biceps, leg extension, écarté haltères.", link: "/apprendre/muscles" },
  { term: "Exercice polyarticulaire", definition: "Exercice sollicitant plusieurs muscles via plusieurs articulations. Squat, développé couché, tractions, rowing.", link: "/apprendre/muscles" },
  { term: "Contraction concentrique", definition: "Le muscle se raccourcit pour produire le mouvement. Phase de poussée ou de traction.", link: "/apprendre/contractions" },
  { term: "Contraction excentrique", definition: "Le muscle s’allonge sous tension pour freiner le mouvement. Phase de descente contrôlée, la plus efficace pour l’hypertrophie.", link: "/apprendre/contractions" },
  { term: "Contraction isométrique", definition: "Le muscle produit une force sans changer de longueur — il maintient une position. Gainage, pause en bas du squat.", link: "/apprendre/contractions" },
  { term: "Contraction pliométrique", definition: "Enchaînement rapide d’un étirement (excentrique) suivi d’une contraction explosive (concentrique). Principe du ressort.", link: "/apprendre/contractions" },
  { term: "Stabilisateurs du tronc", definition: "Muscles maintenant la colonne en position neutre : abdominaux (avant) et lombes/spinaux (arrière). Essentiels pour la sécurité.", link: "/apprendre/securite" },
  { term: "Endurance de force", definition: "Capacité à maintenir un effort musculaire dans la durée. Charges 50–70% 1RM, séries de 12–20 reps.", link: "/apprendre/connaissances" },
  { term: "Hypertrophie", definition: "Augmentation du volume musculaire. Charges 65–80% 1RM, séries de 8–12 reps, volume suffisant.", link: "/apprendre/connaissances" },
  { term: "Puissance", definition: "Force maximale en un minimum de temps. Charges 80–95% 1RM, séries de 1–6 reps, récupération complète.", link: "/apprendre/connaissances" },
];

export function GlossaireContent() {
  return <LearnGlossary terms={TERMS} />;
}
