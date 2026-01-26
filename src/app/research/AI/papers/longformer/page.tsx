import ResearchPage from "@/components/ResearchPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Longformer",
  description: "",
  other: {
    slug: "AI/papers/longformer",
    created: "2026-01-26",
    lastUpdated: "2026-01-26",
    tags: ["AI"],
  },
};

export default function Page() {
  return <ResearchPage metadata={metadata} />;
}
