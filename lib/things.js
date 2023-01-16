import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeKatex from "rehype-katex";
import prism from "remark-prism";

import rehypeStringify from "rehype-stringify";

const thingsDirectory = path.join(process.cwd(), "things");

export function getThingsData() {
  // Get file names under /things
  const fileNames = fs.readdirSync(thingsDirectory);
  const allThingsData = fileNames.map((fileName) => {
    // Remove ".md" from file name to get id
    const id = fileName.replace(/\.md$/, "");
    // Read markdown file as string
    const fullPath = path.join(thingsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, "utf8");
    // Use gray-matter to parse the thing metadata section
    const matterResult = matter(fileContents);
    // Combine the data with the id
    return {
      id,
      ...matterResult.data,
    };
  });
  return allThingsData;
}

export function getAllThingIds() {
  const fileNames = fs.readdirSync(thingsDirectory);
  return fileNames.map((fileName) => {
    return {
      params: {
        id: fileName.replace(/\.md$/, ""),
      },
    };
  });
}

export async function getThingData(id) {
  const fullPath = path.join(thingsDirectory, `${id}.md`);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  // Use gray-matter to parse the thing metadata section
  const matterResult = matter(fileContents);
  // Use remark to convert markdown into HTML string
  const processedContent = await remark()
    .use(html)
    .use(remarkParse)
    .use(remarkGfm)
    .use(prism)
    .use(remarkMath)
    .use(remarkRehype)
    .use(rehypeKatex)
    .use(rehypeStringify)
    .process(matterResult.content);
  const contentHtml = processedContent.toString();
  // Combine the data with the id
  return {
    id,
    contentHtml,
    ...matterResult.data,
  };
}
