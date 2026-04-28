// Sprint A5 — Page /rejoindre, point d'entrée des QR codes prof.
//
// Cause racine traitée (audit-cc 2026-04-28 L08) : les QR codes générés par
// /prof/(authed)/mes-classes/[id] et /prof/(authed)/mes-classes pointent vers
// `${baseUrl.eleve}/rejoindre?code=XXX`. Avant ce sprint cette route n'existait
// pas → scan → 404 même en prod.
//
// Comportement :
//   1. Server component lit `?code=XXX` du querystring (ou string vide si absent).
//   2. Délègue à RejoindreClient (formulaire JoinClassForm pré-rempli).
//   3. Sur succès, le client redirige vers /ma-classe (préfixe locale géré).
//
// L'auth utilisateur est gérée côté API : si pas de session, /api/me/classes/join
// déclenche signInAnonymously avant de créer le student_profile.
//
// Référence : GOUVERNANCE_EDITORIALE.md §2.4 (rôle student).

import type { Metadata } from "next";
import { getServerLang, getServerT } from "@/lib/i18n/server";
import { RejoindreClient } from "./RejoindreClient";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ code?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const lang = getServerLang(locale);
  const t = getServerT(lang);
  return {
    title: t("rejoindre.title"),
    robots: { index: false, follow: false },
  };
}

export default async function RejoindrePage({ searchParams }: Props) {
  const { code } = await searchParams;
  const initialCode = (code ?? "").toString();
  return <RejoindreClient initialCode={initialCode} />;
}
