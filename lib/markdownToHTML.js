import { remark } from "remark";
import html from "remark-html";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeKatex from "rehype-katex";
import rehypeStringify from "rehype-stringify";

export default async function markdownToHTML(markdownContent) {
  const htmlContent = await remark()
    .use(html)
    .use(remarkParse)
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
    .use(rehypeStringify)
    .process(markdownContent);
  return htmlContent.toString();
}
