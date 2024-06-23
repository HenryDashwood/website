import { unified } from "unified";

import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeKatex from "rehype-katex";
import rehypeStringify from "rehype-stringify";
import rehypePrettyCode from "rehype-pretty-code";
import remarkEmbedder from "@remark-embedder/core";
import oembedTransformer from "@remark-embedder/transformer-oembed";

export default async function markdownToHTML(markdownContent) {
  const htmlContent = await unified()
    .use(remarkParse)
    .use(remarkEmbedder, {
      transformers: [oembedTransformer],
      params: { theme: "light", dnt: true, omit_script: true },
    })
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype)
    .use(rehypeKatex, {
      strict: (errorCode, errorMsg, token) => {
        if (errorCode === "newLineInDisplayMode") {
          return false; // don't generate the warning
        }
        return "warn"; // use default behavior for other warnings
      },
    })
    .use(rehypePrettyCode, {
      theme: "github-light",
      keepBackground: false,
    })
    .use(rehypeStringify)
    .process(markdownContent);

  return htmlContent.toString();
}
