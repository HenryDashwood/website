import { GetResearchTree } from "@/lib/research";
import { NextResponse } from "next/server";

export async function GET() {
  // Only allow in development mode
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const researchTree = await GetResearchTree();
    return NextResponse.json(researchTree);
  } catch (error) {
    console.error("Error getting research tree:", error);
    return NextResponse.json({ error: "Failed to get research tree" }, { status: 500 });
  }
}
