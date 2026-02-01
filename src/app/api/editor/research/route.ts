import { GetAllResearch } from "@/lib/research";
import { NextResponse } from "next/server";

export async function GET() {
  // Only allow in development mode
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const allResearch = await GetAllResearch(false);

    const research = allResearch.map((item) => ({
      slug: item.slug,
      title: item.metadata.title ? String(item.metadata.title) : item.slug,
      description: item.metadata.description ? String(item.metadata.description) : "",
      created: item.metadata.other?.created ? String(item.metadata.other.created) : null,
      lastUpdated: item.metadata.other?.lastUpdated ? String(item.metadata.other.lastUpdated) : null,
      tags: item.metadata.other?.tags || [],
    }));

    // Already sorted by lastUpdated in GetAllResearch

    return NextResponse.json(research);
  } catch (error) {
    console.error("Error listing research:", error);
    return NextResponse.json({ error: "Failed to list research" }, { status: 500 });
  }
}
