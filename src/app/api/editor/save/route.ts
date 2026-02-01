import { execSync } from "child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

interface SaveRequest {
  slug: string;
  content: string;
  type?: "post" | "research"; // Default to post for backwards compatibility
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
    const { slug, content, type = "post", createNew, metadata } = body;

    if (!slug || content === undefined) {
      return NextResponse.json({ error: "Missing slug or content" }, { status: 400 });
    }

    // Validate slug based on type
    if (type === "post") {
      // Posts: only allow lowercase letters, numbers, and hyphens
      if (!/^[a-z0-9-]+$/.test(slug)) {
        return NextResponse.json(
          { error: "Invalid slug: only lowercase letters, numbers, and hyphens allowed" },
          { status: 400 }
        );
      }
    } else if (type === "research") {
      // Research: allow letters, numbers, hyphens, and forward slashes for nested paths
      if (!/^[a-zA-Z0-9-/]+$/.test(slug)) {
        return NextResponse.json(
          { error: "Invalid slug: only letters, numbers, hyphens, and forward slashes allowed" },
          { status: 400 }
        );
      }
      // Prevent directory traversal
      if (slug.includes("..") || slug.startsWith("/") || slug.endsWith("/")) {
        return NextResponse.json({ error: "Invalid slug format" }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: "Invalid type: must be 'post' or 'research'" }, { status: 400 });
    }

    // Determine paths based on type
    const isResearch = type === "research";
    const baseDir = isResearch
      ? path.join(process.cwd(), `src/app/research/${slug}`)
      : path.join(process.cwd(), `src/app/posts/${slug}`);
    const mdxPath = path.join(baseDir, isResearch ? "content.mdx" : "post.mdx");
    const pagePath = path.join(baseDir, "page.tsx");

    // If creating a new item
    if (createNew) {
      if (existsSync(baseDir)) {
        return NextResponse.json({ error: `${isResearch ? "Research" : "Post"} already exists` }, { status: 409 });
      }

      if (!metadata) {
        return NextResponse.json(
          { error: `Metadata required for new ${isResearch ? "research" : "posts"}` },
          { status: 400 }
        );
      }

      // Create the directory (recursive for nested research paths)
      mkdirSync(baseDir, { recursive: true });

      // Create the page.tsx file with metadata
      const today = new Date().toISOString().split("T")[0];

      const pageContent = isResearch
        ? `import ResearchPage from "@/components/ResearchPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "${metadata.title.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}",
  description: "${metadata.description.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}",
  other: {
    slug: "${slug}",
    created: "${today}",
    lastUpdated: "${today}",
    tags: ${JSON.stringify(metadata.tags)},
  },
};

export default function Page() {
  return <ResearchPage metadata={metadata} />;
}
`
        : `import PostPage from "@/components/PostPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "${metadata.title.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}",
  description: "${metadata.description.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}",
  openGraph: {
    images: [{ url: \`\${process.env.WEBSITE_URL}/api/og?title=${encodeURIComponent(metadata.title)}\` }],
  },
  other: {
    slug: "${slug}",
    published: "${today}",
    tags: ${JSON.stringify(metadata.tags)},
  },
};

export default function Page() {
  return <PostPage metadata={metadata} />;
}
`;
      writeFileSync(pagePath, pageContent, "utf-8");
    } else {
      // Check that the item exists for updates
      if (!existsSync(mdxPath)) {
        return NextResponse.json({ error: `${isResearch ? "Research" : "Post"} not found` }, { status: 404 });
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
    console.error("Error saving:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
