#!/usr/bin/env bun

import { existsSync, mkdirSync, writeFileSync } from "fs";
import path from "path";

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
  console.error("Usage: bun run new:research <slug> [title]");
  console.error("");
  console.error("Examples:");
  console.error("  bun run new:research ai");
  console.error('  bun run new:research economics/urban-theory "Urban Theory Notes"');
  console.error("  bun run new:research biology/genomics/crispr");
  process.exit(1);
}

const slug = args[0];
const title =
  args[1] ||
  slug
    .split("/")
    .pop()!
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const today = new Date().toISOString().split("T")[0];
const researchDir = path.join(process.cwd(), "src/app/research", slug);
const imagesDir = path.join(process.cwd(), "public/images/research", slug);

// Check if directory already exists
if (existsSync(researchDir)) {
  console.error(`Error: Research page already exists at ${researchDir}`);
  process.exit(1);
}

// Create directories (including any nested directories)
mkdirSync(researchDir, { recursive: true });
mkdirSync(imagesDir, { recursive: true });

// Generate page.tsx content
const pageContent = `import ResearchPage from "@/components/ResearchPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "${title}",
  description: "",
  other: {
    slug: "${slug}",
    created: "${today}",
    lastUpdated: "${today}",
    tags: [],
  },
};

export default function Page() {
  return <ResearchPage metadata={metadata} />;
}
`;

// Generate content.mdx content
const mdxContent = "";

// Write files
writeFileSync(path.join(researchDir, "page.tsx"), pageContent);
writeFileSync(path.join(researchDir, "content.mdx"), mdxContent);

console.log(`✓ Created research page: ${slug}`);
console.log(`  - ${researchDir}/page.tsx`);
console.log(`  - ${researchDir}/content.mdx`);
console.log(`  - ${imagesDir}/ (for images)`);
console.log("");
console.log(`Edit the files to add your content and update the metadata.`);
console.log(`Use /images/research/${slug}/<image> for image paths.`);
