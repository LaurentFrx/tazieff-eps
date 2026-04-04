import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { mdxComponents } from "@/lib/mdx/components";
import { remarkAutolink } from "@/lib/mdx/remark-autolink";

export async function renderMdx(source: string) {
  const { content } = await compileMDX({
    source,
    components: mdxComponents,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm, remarkAutolink],
      },
    },
  });

  return content;
}
