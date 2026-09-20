import type { Metadata } from "next";

import ResearchPage from "@/components/ResearchPage";

export const metadata: Metadata = {
  title: "Self Attention",
  description: "",
  other: {
    slug: "AI/attention/self-attention",
    created: "2026-01-26",
    lastUpdated: "2026-01-26",
    tags: [],
  },
};

export default function Page() {
  return <ResearchPage metadata={metadata} />;
}
