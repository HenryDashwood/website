import { execSync } from "child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

interface SaveRequest {
  slug: string;
  content: string;
  createNew?: boolean;
  metadata?: {
    title: string;
    description: string;
    tags: string[];
  };
  format?: boolean; // Whether to run prettier after saving
}

export async function POST(request: NextRequest) {
  // Only allow in development mode
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body: SaveRequest = await request.json();
    const { slug, content, createNew, metadata } = body;

    if (!slug || content === undefined) {
      return NextResponse.json({ error: "Missing slug or content" }, { status: 400 });
    }

    // Validate slug: only allow lowercase letters, numbers, and hyphens
    // This prevents both directory traversal and code injection when interpolating into page.tsx
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: "Invalid slug: only lowercase letters, numbers, and hyphens allowed" },
        { status: 400 }
      );
    }

    const postDir = path.join(process.cwd(), `src/app/posts/${slug}`);
    const mdxPath = path.join(postDir, "post.mdx");
    const pagePath = path.join(postDir, "page.tsx");

    // If creating a new post
    if (createNew) {
      if (existsSync(postDir)) {
        return NextResponse.json({ error: "Post already exists" }, { status: 409 });
      }

      if (!metadata) {
        return NextResponse.json({ error: "Metadata required for new posts" }, { status: 400 });
      }

      // Create the directory
      mkdirSync(postDir, { recursive: true });

      // Create the page.tsx file with metadata
      const pageContent = `import PostPage from "@/components/PostPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "${metadata.title.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}",
  description: "${metadata.description.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}",
  openGraph: {
    images: [{ url: \`\${process.env.WEBSITE_URL}/api/og?title=${encodeURIComponent(metadata.title)}\` }],
  },
  other: {
    slug: "${slug}",
    published: "${new Date().toISOString().split("T")[0]}",
    tags: ${JSON.stringify(metadata.tags)},
  },
};

export default function Page() {
  return <PostPage metadata={metadata} />;
}
`;
      writeFileSync(pagePath, pageContent, "utf-8");
    } else {
      // Check that the post exists for updates
      if (!existsSync(mdxPath)) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }
    }

    // Write the MDX content
    writeFileSync(mdxPath, content, "utf-8");

    // Run prettier on the file
    try {
      execSync(`bunx prettier --write "${mdxPath}"`, {
        cwd: process.cwd(),
        stdio: "pipe",
      });
    } catch (prettierError) {
      console.warn("Prettier failed, continuing without formatting:", prettierError);
    }

    // Read back the formatted content
    const formattedContent = readFileSync(mdxPath, "utf-8");
    const stats = statSync(mdxPath);

    return NextResponse.json({
      success: true,
      slug,
      content: formattedContent,
      mtime: stats.mtimeMs,
    });
  } catch (error) {
    console.error("Error saving post:", error);
    return NextResponse.json({ error: "Failed to save post" }, { status: 500 });
  }
}
