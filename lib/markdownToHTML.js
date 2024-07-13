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

function handleError({ error, url, transformer }) {
  if (
    transformer.name !== "@remark-embedder/transformer-oembed" ||
    !url.includes("x.com")
  ) {
    // we're only handling errors from this specific transformer and the twitter URL
    // so we'll rethrow errors from any other transformer/url
    throw error;
  }
  return `<p>Unable to embed <a href="${url}">this tweet</a>.</p>`;
}

export default async function markdownToHTML(markdownContent) {
  const htmlContent = await unified()
    .use(remarkParse)
    .use(remarkEmbedder, {
      transformers: [oembedTransformer],
      params: { theme: "light", dnt: true, omit_script: true },
      handleError,
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

  const convertedHtml = htmlContent.toString();
  const hasTwitterEmbed = convertedHtml.includes('class="twitter-tweet"');

  return {
    content: convertedHtml,
    hasTwitterEmbed: hasTwitterEmbed,
  };
}
