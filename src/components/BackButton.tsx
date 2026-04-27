import { LocaleLink } from "@/components/LocaleLink";

interface BackButtonProps {
  href: string;
  label: string;
}

export function BackButton({ href, label }: BackButtonProps) {
  return (
    <LocaleLink
      href={href}
      className="inline-flex items-center gap-1 py-2 pr-3 -ml-1 text-sm font-medium text-zinc-600 dark:text-zinc-400 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100 group min-h-[44px]"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="transition-transform group-hover:-translate-x-0.5"
      >
        <path d="M12.5 15l-5-5 5-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
    </LocaleLink>
  );
}
