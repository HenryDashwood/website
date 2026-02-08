import ResearchPage from "@/components/ResearchPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tokenisation",
  description: "Overview of tokenisation for language models",
  other: {
    slug: "AI/tokenisation",
    created: "2026-02-07",
    lastUpdated: "2026-02-07",
    tags: ["AI"],
  },
};

export default function Page() {
  return <ResearchPage metadata={metadata} />;
}
