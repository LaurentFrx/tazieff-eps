import type { ComponentPropsWithoutRef } from "react";
import { Checklist } from "@/components/mdx/Checklist";
import { Figure } from "@/components/mdx/Figure";

type CalloutProps = ComponentPropsWithoutRef<"div"> & {
  tone?: "info" | "warning" | "success";
};

const CALLOUT_STYLES: Record<NonNullable<CalloutProps["tone"]>, string> = {
  info: "border-[color:var(--accent-2)] bg-[color:var(--accent-2-soft)]",
  warning: "border-[color:var(--accent)] bg-[color:var(--accent-soft)]",
  success: "border-[color:var(--accent-2)] bg-[color:var(--accent-2-soft)]",
};

export const mdxComponents = {
  h1: ({ className, ...props }: ComponentPropsWithoutRef<"h1">) => (
    <h1
      className={`text-3xl font-semibold text-[color:var(--ink)] ${className ?? ""}`.trim()}
      {...props}
    />
  ),
  h2: ({ className, ...props }: ComponentPropsWithoutRef<"h2">) => (
    <h2
      className={`text-2xl font-semibold text-[color:var(--ink)] ${className ?? ""}`.trim()}
      {...props}
    />
  ),
  h3: ({ className, ...props }: ComponentPropsWithoutRef<"h3">) => (
    <h3
      className={`text-xl font-semibold text-[color:var(--ink)] ${className ?? ""}`.trim()}
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
  img: ({
    src,
    alt = "",
    title,
  }: ComponentPropsWithoutRef<"img">) => {
    if (typeof src !== "string") {
      return null;
    }
    return (
      <Figure
        src={src}
        alt={alt}
        caption={title ?? undefined}
      />
    );
  },
  Checklist,
  Figure,
  Callout: ({
    tone = "info",
    className,
    ...props
  }: CalloutProps) => (
    <div
      className={`rounded-[var(--radius)] border p-4 text-[color:var(--ink)] ${
        CALLOUT_STYLES[tone]
      } ${className ?? ""}`.trim()}
      {...props}
    />
  ),
};
