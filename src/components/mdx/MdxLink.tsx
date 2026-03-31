"use client";

import { LocaleLink } from "@/components/LocaleLink";
import type { ComponentPropsWithoutRef } from "react";

export function MdxLink({ href, className, ...props }: ComponentPropsWithoutRef<"a">) {
  const cls = `text-[color:var(--ink)] underline decoration-[color:var(--accent)] ${className ?? ""}`.trim();

  if (href && href.startsWith("/")) {
    return <LocaleLink href={href} className={cls} {...props} />;
  }

  return <a href={href} className={cls} {...props} />;
}
