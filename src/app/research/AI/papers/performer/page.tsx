import ResearchPage from "@/components/ResearchPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Performer",
  description: "",
  other: {
    slug: "AI/papers/performer",
    created: "2026-01-26",
    lastUpdated: "2026-01-26",
    tags: ["AI"],
  },
};

export default function Page() {
  return <ResearchPage metadata={metadata} />;
}
