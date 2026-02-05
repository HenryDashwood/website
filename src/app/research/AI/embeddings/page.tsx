import ResearchPage from "@/components/ResearchPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Embeddings",
  description: "What actually are embeddings",
  other: {
    slug: "AI/embeddings",
    created: "2026-02-05",
    lastUpdated: "2026-02-05",
    tags: ["AI"],
  },
};

export default function Page() {
  return <ResearchPage metadata={metadata} />;
}
