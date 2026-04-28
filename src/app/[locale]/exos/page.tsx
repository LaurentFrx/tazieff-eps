import { localizedRedirect } from "@/lib/navigation";

type Props = { params: Promise<{ locale: string }> };

export default async function ExosPage({ params }: Props) {
  const { locale } = await params;
  localizedRedirect("/exercices", locale);
}
