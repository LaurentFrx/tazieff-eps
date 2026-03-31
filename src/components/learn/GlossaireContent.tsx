"use client";

import { LearnGlossary } from "@/components/learn/LearnGlossary";

const TERMS = [
  { term: "RM \u2014 R\u00e9p\u00e9tition Maximale", definition: "La charge maximale que tu peux soulever pour un nombre pr\u00e9cis de r\u00e9p\u00e9titions avec une technique correcte. Le 1RM est la charge maximale pour une seule r\u00e9p\u00e9tition.", link: "/apprendre/rm-rir-rpe" },
  { term: "RIR \u2014 Reps In Reserve", definition: "Le nombre de r\u00e9p\u00e9titions que tu pourrais encore faire avant l\u2019\u00e9chec musculaire. Un RIR 2 signifie que tu aurais pu faire 2 reps de plus.", link: "/apprendre/rm-rir-rpe" },
  { term: "RPE \u2014 Rating of Perceived Exertion", definition: "\u00c9chelle subjective de 1 \u00e0 10 qui \u00e9value la difficult\u00e9 globale ressentie durant une s\u00e9rie. Un RPE 8 correspond \u00e0 une s\u00e9rie difficile.", link: "/apprendre/rm-rir-rpe" },
  { term: "R\u00e9p\u00e9tition (Rep)", definition: "Un mouvement complet d\u2019un exercice, de la position de d\u00e9part au retour. Une mont\u00e9e + une descente au curl = 1 r\u00e9p\u00e9tition." },
  { term: "S\u00e9rie", definition: "Un ensemble de r\u00e9p\u00e9titions effectu\u00e9es sans pause. 3 s\u00e9ries de 10 = 3\u00d710 reps avec repos entre chaque." },
  { term: "Intensit\u00e9", definition: "Le niveau d\u2019effort par rapport \u00e0 ta capacit\u00e9 maximale. S\u2019exprime en pourcentage du 1RM ou via le RPE/RIR." },
  { term: "Volume", definition: "Quantit\u00e9 totale de travail : s\u00e9ries \u00d7 r\u00e9p\u00e9titions \u00d7 charge. Un volume progressif est cl\u00e9 pour la progression." },
  { term: "R\u00e9cup\u00e9ration", definition: "Temps de repos entre deux s\u00e9ries. Varie de 30s (endurance) \u00e0 5 min (puissance) selon l\u2019objectif." },
  { term: "Agoniste", definition: "Le muscle principal qui produit le mouvement en se contractant. Le biceps est agoniste lors de la flexion du coude.", link: "/apprendre/muscles" },
  { term: "Antagoniste", definition: "Le muscle oppos\u00e9 \u00e0 l\u2019agoniste, qui s\u2019\u00e9tire pour permettre le mouvement. Le triceps est antagoniste lors de la flexion du coude.", link: "/apprendre/muscles" },
  { term: "Exercice d\u2019isolation", definition: "Exercice ciblant un seul muscle via une seule articulation. Curl biceps, leg extension, \u00e9cart\u00e9 halt\u00e8res.", link: "/apprendre/muscles" },
  { term: "Exercice polyarticulaire", definition: "Exercice sollicitant plusieurs muscles via plusieurs articulations. Squat, d\u00e9velopp\u00e9 couch\u00e9, tractions, rowing.", link: "/apprendre/muscles" },
  { term: "Contraction concentrique", definition: "Le muscle se raccourcit pour produire le mouvement. Phase de pouss\u00e9e ou de traction.", link: "/apprendre/contractions" },
  { term: "Contraction excentrique", definition: "Le muscle s\u2019allonge sous tension pour freiner le mouvement. Phase de descente contr\u00f4l\u00e9e, la plus efficace pour l\u2019hypertrophie.", link: "/apprendre/contractions" },
  { term: "Contraction isom\u00e9trique", definition: "Le muscle produit une force sans changer de longueur \u2014 il maintient une position. Gainage, pause en bas du squat.", link: "/apprendre/contractions" },
  { term: "Contraction pliom\u00e9trique", definition: "Encha\u00eenement rapide d\u2019un \u00e9tirement (excentrique) suivi d\u2019une contraction explosive (concentrique). Principe du ressort.", link: "/apprendre/contractions" },
  { term: "Stabilisateurs du tronc", definition: "Muscles maintenant la colonne en position neutre : abdominaux (avant) et lombes/spinaux (arri\u00e8re). Essentiels pour la s\u00e9curit\u00e9.", link: "/apprendre/securite" },
  { term: "Endurance de force", definition: "Capacit\u00e9 \u00e0 maintenir un effort musculaire dans la dur\u00e9e. Charges 50\u201370% 1RM, s\u00e9ries de 12\u201320 reps." },
  { term: "Hypertrophie", definition: "Augmentation du volume musculaire. Charges 65\u201380% 1RM, s\u00e9ries de 8\u201312 reps, volume suffisant." },
  { term: "Puissance", definition: "Force maximale en un minimum de temps. Charges 80\u201395% 1RM, s\u00e9ries de 1\u20136 reps, r\u00e9cup\u00e9ration compl\u00e8te." },
];

export function GlossaireContent() {
  return <LearnGlossary terms={TERMS} />;
}
