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
const mediaDir = path.join(process.cwd(), "public/media/research", slug);

// Check if directory already exists
if (existsSync(researchDir)) {
  console.error(`Error: Research page already exists at ${researchDir}`);
  process.exit(1);
}

// Create directory (including any nested directories)
mkdirSync(researchDir, { recursive: true });

// Metadata lives in the MDX file itself. Optional field: log
// ([{ date: "YYYY-MM-DD", note: "What changed" }]).
const mdxContent = `export const metadata = {
  title: ${JSON.stringify(title)},
  description: "",
  created: "${today}",
  tags: [],
  log: [{ date: "${today}", note: "Started this note" }],
};

`;

// Write files
writeFileSync(path.join(researchDir, "content.mdx"), mdxContent);

console.log(`✓ Created research page: ${slug}`);
console.log(`  - ${researchDir}/content.mdx`);
console.log("");
console.log(`Edit content.mdx to add your content.`);
console.log(`Put note-specific components alongside content.mdx (or in _components/).`);
console.log(`Put media in ${mediaDir}/ and reference as /media/research/${slug}/<file>.`);
