import type { Metadata } from "next";
import { getServerLang, getServerT } from "@/lib/i18n/server";
import { EnseignantMovedClient } from "./EnseignantMovedClient";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const lang = getServerLang(locale);
  const t = getServerT(lang);
  return { title: t("enseignant.title") };
}

// Sprint P0.7-nonies — Rendre uniquement le message "espace déménagé".
// L'ancien composant EnseignantDashboard reste dans le repo (archive) mais
// n'est plus monté. La sous-route /enseignant/partage/* reste fonctionnelle
// indépendamment (décodage de séances partagées par lien).
export default function EnseignantPage() {
  return <EnseignantMovedClient />;
}
