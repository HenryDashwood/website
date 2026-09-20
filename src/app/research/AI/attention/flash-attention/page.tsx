import type { Metadata } from "next";

import ResearchPage from "@/components/ResearchPage";

export const metadata: Metadata = {
  title: "Flash Attention",
  description: "",
  other: {
    slug: "AI/attention/flash-attention",
    created: "2026-01-27",
    lastUpdated: "2026-01-27",
    tags: ["AI"],
  },
};

export default function Page() {
  return <ResearchPage metadata={metadata} />;
}
