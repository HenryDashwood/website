import type { Metadata } from "next";

import ResearchPage from "@/components/ResearchPage";

export const metadata: Metadata = {
  title: "Architecture vs Computing Power",
  description: "",
  other: {
    slug: "AI/questions/architecture-vs-computing-power",
    created: "2026-10-25",
    lastUpdated: "2026-10-25",
    tags: ["AI"],
  },
};

export default function Page() {
  return <ResearchPage metadata={metadata} />;
}
