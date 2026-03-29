import type { Lang } from "@/lib/i18n/messages";

const SUPPORTED_LOCALES: Lang[] = ["fr", "en", "es"];

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export default function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  return children;
}
