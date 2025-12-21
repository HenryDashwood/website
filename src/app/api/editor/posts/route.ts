import { readdirSync, statSync } from "fs";
import { NextResponse } from "next/server";
import path from "path";

export async function GET() {
  // Only allow in development mode
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const postsPath = path.join(process.cwd(), "src/app/posts");
    const postDirectories = readdirSync(postsPath).filter(
      (item) => statSync(path.join(postsPath, item)).isDirectory() && !item.startsWith("[")
    );

    const posts = [];
    for (const slug of postDirectories) {
      try {
        const { metadata } = await import(`@/app/posts/${slug}/page`);
        posts.push({
          slug,
          title: metadata.title || slug,
          published: metadata.other?.published || null,
          tags: metadata.other?.tags || [],
        });
      } catch {
        // Skip posts that don't have proper metadata
        posts.push({
          slug,
          title: slug,
          published: null,
          tags: [],
        });
      }
    }

    // Sort by published date (newest first), unpublished at the end
    posts.sort((a, b) => {
      if (!a.published && !b.published) return 0;
      if (!a.published) return 1;
      if (!b.published) return -1;
      return new Date(b.published).getTime() - new Date(a.published).getTime();
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Error listing posts:", error);
    return NextResponse.json({ error: "Failed to list posts" }, { status: 500 });
  }
}
