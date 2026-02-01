import { existsSync, readFileSync, statSync } from "fs";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

export async function GET(request: NextRequest) {
  // Only allow in development mode
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const slug = request.nextUrl.searchParams.get("slug");
  const type = request.nextUrl.searchParams.get("type") || "post"; // Default to post for backwards compatibility
  const checkOnly = request.nextUrl.searchParams.get("checkOnly") === "true";
  const knownMtime = request.nextUrl.searchParams.get("mtime");

  if (!slug) {
    return NextResponse.json({ error: "Missing slug parameter" }, { status: 400 });
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
    // Research: allow lowercase letters, numbers, hyphens, and forward slashes for nested paths
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

  try {
    // Determine the file path based on type
    const mdxPath =
      type === "post"
        ? path.join(process.cwd(), `src/app/posts/${slug}/post.mdx`)
        : path.join(process.cwd(), `src/app/research/${slug}/content.mdx`);

    if (!existsSync(mdxPath)) {
      return NextResponse.json({ error: `${type === "post" ? "Post" : "Research"} not found` }, { status: 404 });
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
    console.error(`Error reading ${type}:`, error);
    return NextResponse.json({ error: `Failed to read ${type}` }, { status: 500 });
  }
}
