import { localizedRedirect } from "@/lib/navigation";

type Props = { params: Promise<{ locale: string }> };

export default async function TimerRedirect({ params }: Props) {
  const { locale } = await params;
  localizedRedirect("/outils/timer", locale);
}
