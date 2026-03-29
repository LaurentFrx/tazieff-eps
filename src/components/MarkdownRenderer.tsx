"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { mdxComponents } from "@/lib/mdx/components";

export default function MarkdownRenderer({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdxComponents}>
      {children}
    </ReactMarkdown>
  );
}
