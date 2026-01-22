import type { ComponentPropsWithoutRef } from "react";

export const mdxComponents = {
  h2: ({ className, ...props }: ComponentPropsWithoutRef<"h2">) => (
    <h2
      className={`text-xl font-semibold text-[color:var(--ink)] ${className ?? ""}`.trim()}
      {...props}
    />
  ),
  h3: ({ className, ...props }: ComponentPropsWithoutRef<"h3">) => (
    <h3
      className={`text-lg font-semibold text-[color:var(--ink)] ${className ?? ""}`.trim()}
      {...props}
    />
  ),
  p: ({ className, ...props }: ComponentPropsWithoutRef<"p">) => (
    <p
      className={`text-[color:var(--muted)] leading-relaxed ${className ?? ""}`.trim()}
      {...props}
    />
  ),
  ul: ({ className, ...props }: ComponentPropsWithoutRef<"ul">) => (
    <ul
      className={`list-disc space-y-2 pl-5 text-[color:var(--muted)] ${className ?? ""}`.trim()}
      {...props}
    />
  ),
  li: ({ className, ...props }: ComponentPropsWithoutRef<"li">) => (
    <li className={`text-[color:var(--muted)] ${className ?? ""}`.trim()} {...props} />
  ),
  a: ({ className, ...props }: ComponentPropsWithoutRef<"a">) => (
    <a
      className={`text-[color:var(--ink)] underline decoration-[color:var(--accent)] ${
        className ?? ""
      }`.trim()}
      {...props}
    />
  ),
};
