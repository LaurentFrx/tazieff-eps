import type { Lang } from "@/lib/i18n/messages";

const VALID_LOCALES: Lang[] = ["fr", "en", "es"];

export function generateStaticParams() {
  return VALID_LOCALES.map((locale) => ({ locale }));
}

export default function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // During migration: providers stay in root layout.
  // After all pages are moved here, providers will be transferred.
  return <>{children}</>;
}
