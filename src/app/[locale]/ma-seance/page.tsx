import { localizedRedirect } from "@/lib/navigation";

type Props = { params: Promise<{ locale: string }> };

export default async function MaSeanceRedirect({ params }: Props) {
  const { locale } = await params;
  localizedRedirect("/outils/ma-seance", locale);
}
