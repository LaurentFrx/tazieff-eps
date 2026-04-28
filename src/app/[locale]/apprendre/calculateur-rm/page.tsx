import { localizedRedirect } from "@/lib/navigation";

type Props = { params: Promise<{ locale: string }> };

export default async function CalculateurRMRedirect({ params }: Props) {
  const { locale } = await params;
  localizedRedirect("/outils/calculateur-rm", locale);
}
