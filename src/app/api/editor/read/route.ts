import { existsSync, readFileSync, statSync } from "fs";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

export async function GET(request: NextRequest) {
  // Only allow in development mode
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const slug = request.nextUrl.searchParams.get("slug");
  const checkOnly = request.nextUrl.searchParams.get("checkOnly") === "true";
  const knownMtime = request.nextUrl.searchParams.get("mtime");

  if (!slug) {
    return NextResponse.json({ error: "Missing slug parameter" }, { status: 400 });
  }

  // Validate slug to prevent directory traversal
  if (slug.includes("..") || slug.includes("/") || slug.includes("\\")) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  try {
    const mdxPath = path.join(process.cwd(), `src/app/posts/${slug}/post.mdx`);

    if (!existsSync(mdxPath)) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const stats = statSync(mdxPath);
    const mtime = stats.mtimeMs;

    // If just checking for changes, compare mtime
    if (checkOnly && knownMtime) {
      const hasChanged = mtime !== parseFloat(knownMtime);
      if (!hasChanged) {
        return NextResponse.json({ changed: false, mtime });
      }
    }

    const content = readFileSync(mdxPath, "utf-8");

    return NextResponse.json({ content, slug, mtime, changed: true });
  } catch (error) {
    console.error("Error reading post:", error);
    return NextResponse.json({ error: "Failed to read post" }, { status: 500 });
  }
}
