#!/usr/bin/env bun

import { existsSync, mkdirSync, writeFileSync } from "fs";
import path from "path";

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
  console.error("Usage: bun run new:post <slug> [title]");
  console.error("");
  console.error("Examples:");
  console.error("  bun run new:post my-new-post");
  console.error('  bun run new:post my-new-post "My New Post Title"');
  process.exit(1);
}

const slug = args[0];
const title =
  args[1] ||
  slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const today = new Date().toISOString().split("T")[0];
const postDir = path.join(process.cwd(), "src/app/posts", slug);
const mediaDir = path.join(process.cwd(), "public/media/posts", slug);

// Check if directory already exists
if (existsSync(postDir)) {
  console.error(`Error: Post already exists at ${postDir}`);
  process.exit(1);
}

// Create post directory
mkdirSync(postDir, { recursive: true });

// Generate page.tsx content
const encodedTitle = encodeURIComponent(title);
const pageContent = `import PostPage from "@/components/PostPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "${title}",
  description: "",
  openGraph: {
    images: [
      {
        url: \`\${process.env.WEBSITE_URL}/api/og?title=${encodedTitle}\`,
      },
    ],
  },
  other: {
    slug: "${slug}",
    published: "${today}",
    tags: [],
  },
};

export default function Post() {
  return <PostPage metadata={metadata} />;
}
`;

// Generate post.mdx content
const mdxContent = "";

// Write files
writeFileSync(path.join(postDir, "page.tsx"), pageContent);
writeFileSync(path.join(postDir, "post.mdx"), mdxContent);

console.log(`✓ Created post: ${slug}`);
console.log(`  - ${postDir}/page.tsx`);
console.log(`  - ${postDir}/post.mdx`);
console.log("");
console.log(`Edit the files to add your content and update the metadata.`);
console.log(`Put post-specific components alongside post.mdx (or in _components/).`);
console.log(`Put media in ${mediaDir}/ and reference as /media/posts/${slug}/<file>.`);
