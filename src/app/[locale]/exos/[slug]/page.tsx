import { localizedRedirect } from "@/lib/navigation";

type ExoPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export default async function ExoPage({ params }: ExoPageProps) {
  const { locale, slug } = await params;
  localizedRedirect(`/exercices/${slug}`, locale);
}
